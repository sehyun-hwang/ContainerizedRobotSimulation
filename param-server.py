from socket import gethostname as Host
from os import environ
from base64 import b64decode
import requests
from multiprocessing import cpu_count
import asyncio

import tensorflow.keras.layers.experimental.preprocessing as kpl
import tensorflow.keras as keras
import tensorflow as tf
import random

host = Host()
print('Host', host)

API = 'https://proxy.hwangsehyun.com/robot/ddpg'
NETWORK = '.network'
PORT = 8500
WORKERS = 1


def create_in_process_cluster(num_workers):
    cluster_dict = {}
    IsWorker = '-' in host

    if IsWorker:
        ps, i = host.split('-')
        i = int(i)
        print('worker', i, 'for ps', ps)

    else:
        ps = host
        print('ps')

    workers = [f'{ps}-{i}' for i in range(WORKERS)]
    if not IsWorker:
        for name in workers:
            requests.post(API, params={"name": name}, data=environ['PARAMS'])

    cluster_dict["ps"] = [f'{ps}{NETWORK}:{PORT}']
    cluster_dict["worker"] = [f'{x}{NETWORK}:{PORT}' for x in workers]
    print(cluster_dict)

    cluster_spec = tf.train.ClusterSpec(cluster_dict)

    worker_config = tf.compat.v1.ConfigProto()
    if cpu_count() < num_workers + 1:
        worker_config.inter_op_parallelism_threads = num_workers + 1

    if IsWorker:
        tf.distribute.Server(cluster_spec,
                             job_name="worker",
                             task_index=i,
                             config=worker_config,
                             protocol="grpc")
    else:
        tf.distribute.Server(cluster_spec,
                             job_name="ps",
                             task_index=0,
                             protocol="grpc")

    cluster_resolver = tf.distribute.cluster_resolver.SimpleClusterResolver(
        cluster_spec, rpc_layer="grpc")
    return cluster_resolver


environ["GRPC_FAIL_FAST"] = "use_caller"

cluster_resolver = create_in_process_cluster(WORKERS)

variable_partitioner = (
    tf.distribute.experimental.partitioners.FixedShardsPartitioner(
        num_shards=1))

strategy = tf.distribute.experimental.ParameterServerStrategy(
    cluster_resolver, variable_partitioner=variable_partitioner)

feature_vocab = [
    "avenger", "ironman", "batman", "hulk", "spiderman", "kingkong",
    "wonder_woman"
]
label_vocab = ["yes", "no"]

with strategy.scope():
    feature_lookup_layer = kpl.StringLookup(vocabulary=feature_vocab)

    label_lookup_layer = kpl.StringLookup(vocabulary=label_vocab,
                                          num_oov_indices=0,
                                          mask_token=None)

    raw_feature_input = keras.layers.Input(shape=(3, ),
                                           dtype=tf.string,
                                           name="feature")
    feature_id_input = feature_lookup_layer(raw_feature_input)
    feature_preprocess_stage = keras.Model({"features": raw_feature_input},
                                           feature_id_input)

    raw_label_input = keras.layers.Input(shape=(1, ),
                                         dtype=tf.string,
                                         name="label")
    label_id_input = label_lookup_layer(raw_label_input)
    label_preprocess_stage = keras.Model({"label": raw_label_input},
                                         label_id_input)


def feature_and_label_gen(num_examples=200):
    examples = {"features": [], "label": []}
    for _ in range(num_examples):
        features = random.sample(feature_vocab, 3)
        label = ["yes"] if "avenger" in features else ["no"]
        examples["features"].append(features)
        examples["label"].append(label)
    return examples


examples = feature_and_label_gen()


def dataset_fn(_):
    raw_dataset = tf.data.Dataset.from_tensor_slices(examples)

    train_dataset = raw_dataset.map(lambda x: ({
        "features":
        feature_preprocess_stage(x["features"])
    }, label_preprocess_stage(x["label"]))).shuffle(200).batch(32).repeat()
    return train_dataset


with strategy.scope():
    model_input = keras.layers.Input(shape=(3, ),
                                     dtype=tf.int64,
                                     name="model_input")

    emb_layer = keras.layers.Embedding(input_dim=len(
        feature_lookup_layer.get_vocabulary()),
                                       output_dim=20)
    emb_output = tf.reduce_mean(emb_layer(model_input), axis=1)
    dense_output = keras.layers.Dense(units=1,
                                      activation="sigmoid")(emb_output)
    model = keras.Model({"features": model_input}, dense_output)

    optimizer = keras.optimizers.RMSprop(learning_rate=0.1)
    accuracy = keras.metrics.Accuracy()
"""### Define the training step
Third, create the training step wrapped into a `tf.function`:
"""


@tf.function
def step_fn(iterator):
    def replica_fn(iterator):
        batch_data, labels = next(iterator)
        with tf.GradientTape() as tape:
            pred = model(batch_data, training=True)
            per_example_loss = keras.losses.BinaryCrossentropy(
                reduction=tf.keras.losses.Reduction.NONE)(labels, pred)
            loss = tf.nn.compute_average_loss(per_example_loss)
            gradients = tape.gradient(loss, model.trainable_variables)

        optimizer.apply_gradients(zip(gradients, model.trainable_variables))

        actual_pred = tf.cast(tf.greater(pred, 0.5), tf.int64)
        accuracy.update_state(labels, actual_pred)
        return loss

    losses = strategy.run(replica_fn, args=(iterator, ))
    return strategy.reduce(tf.distribute.ReduceOp.SUM, losses, axis=None)


coordinator = tf.distribute.experimental.coordinator.ClusterCoordinator(
    strategy)


@tf.function
def per_worker_dataset_fn():
    return strategy.distribute_datasets_from_function(dataset_fn)


per_worker_dataset = coordinator.create_per_worker_dataset(
    per_worker_dataset_fn)
per_worker_iterator = iter(per_worker_dataset)

num_epoches = 4
steps_per_epoch = 5
for i in range(num_epoches):
    accuracy.reset_states()
    for _ in range(steps_per_epoch):
        coordinator.schedule(step_fn, args=(per_worker_iterator, ))
    coordinator.join()
    print("Finished epoch %d, accuracy is %f." %
          (i, accuracy.result().numpy()))

loss = coordinator.schedule(step_fn, args=(per_worker_iterator, ))
print("Final loss is", loss.fetch())

for x, y in [
    (len(emb_layer.weights), 2),
    (emb_layer.weights[0].shape, (5, 20)),
        #(emb_layer.weights[1].shape, (4, 20)),
    (emb_layer.weights[0].device, "/job:ps/replica:0/task:0/device:CPU:0"),
        #(emb_layer.weights[1].device, "/job:ps/replica:0/task:1/device:CPU:0")
]:
    print(x, y, x == y)

eval_dataset = tf.data.Dataset.from_tensor_slices(
    feature_and_label_gen(num_examples=10)).map(
        lambda x: ({
            "features": feature_preprocess_stage(x["features"])
        }, label_preprocess_stage(x["label"]))).batch(32)

eval_accuracy = keras.metrics.Accuracy()
for batch_data, labels in eval_dataset:
    pred = model(batch_data, training=False)
    actual_pred = tf.cast(tf.greater(pred, 0.5), tf.int64)
    eval_accuracy.update_state(labels, actual_pred)

print("Evaluation accuracy: %f" % eval_accuracy.result())

asyncio.get_event_loop().run_forever()
