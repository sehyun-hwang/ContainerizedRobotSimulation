from os import environ
from socket import gethostname as Host
from base64 import b64decode
import json

host = Host()
Params = json.loads(b64decode(environ.get("PARAMS", 'e30=')))

print('Host', host)
print('Params', Params)

API = 'https://proxy.hwangsehyun.com/robot/paramserver/'
NETWORK = '.network'
PORT = 8500
ID = Params.get('id', 59)
WORKERS = Params.get('Workers', 1)
EPOCHS = 100
environ["GRPC_FAIL_FAST"] = "use_caller"

#from sys import exit; exit()
from pathlib import Path
from multiprocessing import cpu_count
import requests

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


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
    cluster_dict["worker"] = [f'{x}{NETWORK}:{PORT}' for x in workers]
    cluster_dict["ps"] = [f'{ps}{NETWORK}:{PORT}']

    if IsWorker:
        #cluster_dict["worker"][i] = f'localhost:{PORT}'
        pass
    else:
        #cluster_dict["ps"][0] = f'localhost:{PORT}'
        print([
            requests.put(
                API + Path(__file__).stem,
                params={
                    "name": name,
                },
                headers={
                    "Content-Type": "text/plain",
                    "Accept": "text/plain"
                },
                data=environ.get("PARAMS", 'e30='),
            ).text for name in workers
        ])

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


cluster_resolver = create_in_process_cluster(WORKERS)

variable_partitioner = (
    tf.distribute.experimental.partitioners.FixedShardsPartitioner(
        num_shards=1))

strategy = tf.distribute.experimental.ParameterServerStrategy(
    cluster_resolver, variable_partitioner=variable_partitioner)
coordinator = tf.distribute.experimental.coordinator.ClusterCoordinator(
    strategy)

data = requests.get(
    f'https://hwangsehyun.s3-ap-southeast-1.amazonaws.com/robot/{ID}.json'
).json()
first = data[0]
print(first)

data = [[*x['State'], *x['Delta'].values()] for x in data]
dataset = pd.DataFrame(data, None, [
    *[f'State-{i}'
      for i, x in enumerate(first['State'])], *first['Delta'].keys()
])

train_dataset = dataset.sample(frac=0.8, random_state=0)
test_dataset = dataset.drop(train_dataset.index)


def Pop(dataset):
    labels = pd.concat([dataset.pop(x) for x in ['x', 'y', 'z']], axis=1)
    return dataset, labels


train_stats = train_dataset.describe()
Pop(train_stats)
train_stats = train_stats.transpose()
print(train_stats.tail())

train_dataset, train_labels = Pop(train_dataset)
test_dataset, test_labels = Pop(test_dataset)
print(train_labels)


def norm(x):
    return (x - train_stats['mean']) / train_stats['std']


normed_train_data = norm(train_dataset)
normed_test_data = norm(test_dataset)
print(normed_train_data)


def build_model():
    model = keras.Sequential([
        layers.Dense(64,
                     activation='relu',
                     input_shape=[len(train_dataset.keys())]),
        layers.Dense(64, activation='relu'),
        layers.Dense(3)
    ])

    optimizer = tf.keras.optimizers.RMSprop(0.001)

    model.compile(loss='mse', optimizer=optimizer, metrics=['mae', 'mse'])
    return model


def IteratorDataset():
    def dataset_fn(_):
        tf_dataset = tf.data.Dataset.from_tensor_slices(
            (normed_train_data.values.astype(np.float32),
             train_labels.values.astype(np.float32)))
        return tf_dataset.shuffle(len(dataset)).batch(100).repeat()

    @tf.function
    def per_worker_dataset_fn():
        return strategy.distribute_datasets_from_function(dataset_fn)

    per_worker_dataset = coordinator.create_per_worker_dataset(
        per_worker_dataset_fn)
    return iter(per_worker_dataset)


per_worker_iterator = IteratorDataset()

with strategy.scope():
    model = build_model()
    model.summary()

    optimizer = keras.optimizers.RMSprop(0.001)
    mse = keras.metrics.MeanSquaredError()


@tf.function
def step_fn(iterator):
    def replica_fn(iterator):
        batch_data, labels = next(iterator)
        with tf.GradientTape() as tape:
            pred = model(batch_data, training=True)
            per_example_loss = tf.keras.losses.MeanSquaredError(
                reduction=tf.keras.losses.Reduction.NONE)(labels, pred)
            loss = tf.nn.compute_average_loss(per_example_loss)
            gradients = tape.gradient(loss, model.trainable_variables)

        optimizer.apply_gradients(zip(gradients, model.trainable_variables))
        mse.update_state(labels, pred)

        return loss

    losses = strategy.run(replica_fn, args=(iterator, ))
    return strategy.reduce(tf.distribute.ReduceOp.SUM, losses, axis=None)


num_epoches = 10
for i in range(num_epoches):
    mse.reset_states()
    coordinator.schedule(step_fn, args=(per_worker_iterator, ))
    coordinator.join()
    print("Finished epoch %d, MSE is %f." % (i, mse.result().numpy()))

#=asyncio.get_event_loop().run_forever()
