 import Module from './wasm.cpp.js';

 export let Random;

 export const init = length => Module().then(({
 	_DeleteArray,
 	_NewArray: NewArray,
 	HEAPF64: Heap,
 	_Random,
 }) => {
 	Random && _DeleteArray();
 	const ptr = NewArray(length) / Heap.BYTES_PER_ELEMENT;
 	const Subarray = Heap.subarray(ptr, ptr + length);

 	Random = (arr, stddev) => {
 		if (Subarray.length != arr.length)
 			throw new Error(`Shape mismatch: Should be ${Subarray.length}, but got ${arr.length}`);

 		Subarray.set(arr);
 		_Random(stddev);
 		return Array.from(Subarray);
 	};
 });

 /*
  init(2).then(() => {
  	console.log(Random([1, 2], .000001));
  	console.log(Random([3, 4], .000001));
  });
  */
 