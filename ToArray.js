export default async function (asyncIterator) {
    const arr = [];
    for await (const { value } of asyncIterator)
    arr.push(value);
    return arr;
}
