from json import load
import torch
import requests

def imshow(binary):
    requests.post('https://proxy.hwangsehyun.com/imshow/',
                  files={"File": binary})


with open('robot.json') as file:
    Data = load(file)
#print(Data)
length = len(Data)
print(length)

Path = 'model.pt'
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


dim = 6
H = 12

Boundary = 700

x = torch.tensor([x['angles'] for x in Data[:Boundary]], device=device)
y = torch.tensor([x['target'] for x in Data[:Boundary]], device=device)

print('angles', x)
print('target', y)

model = torch.nn.Sequential(
    torch.nn.Linear(dim, H),
    torch.nn.Linear(H, H),
    torch.nn.Linear(H, H),
    torch.nn.Linear(H, dim),
).to(device)


def Train():
    global model, x, y

    loss_fn = torch.nn.L1Loss()
    iter = 100000

    for t in range(iter):
        learning_rate = 5e-3 * (t / iter)
        y_pred = model(x)
        loss = loss_fn(y_pred, y)
        print(t, loss.item())

        model.zero_grad()
        loss.backward()

        with torch.no_grad():
            for param in model.parameters():
                param.data -= learning_rate * param.grad

    torch.save(model.state_dict(), Path)


def Test():
    global model, x, y

    model.load_state_dict(torch.load(Path))
    pred = model.forward(x)

    for y, pred in zip(y, pred):
        print('=' * 100)
        print('Data:', y)
        print('Prediction:', pred)
        print('Error:', y - pred)


Train()
Test()
