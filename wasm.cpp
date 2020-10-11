#include <iostream>
#include <random>
#include <emscripten/emscripten.h>

int main(int argc, char ** argv) {
    std::cout << "main" << std::endl;
    
    return 0;
}

extern "C" {

typedef double type;
type * arr;
int length;

type EMSCRIPTEN_KEEPALIVE *NewArray(int _length) {
    length = _length;
    std::cout << "length " << length << std::endl;
    
    arr = new type[length];
    return arr;
}

std::default_random_engine generator;

void EMSCRIPTEN_KEEPALIVE Random(type stddev) {
    std::cout << "stddev: " << stddev << std::endl;

    for (int i=0; i<length; i++) {
        std::normal_distribution<type> distribution(arr[i], stddev);
        arr[i] = distribution(generator);
    }
}

void EMSCRIPTEN_KEEPALIVE DeleteArray() {
    delete arr;
}

}