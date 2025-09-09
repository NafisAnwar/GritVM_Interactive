#include <emscripten/bind.h>
#include "GritVMWeb.hpp"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(gritvm_module) {
    enum_<STATUS>("STATUS")
        .value("WAITING", WAITING)
        .value("READY", READY)
        .value("RUNNING", RUNNING)
        .value("HALTED", HALTED)
        .value("ERRORED", ERRORED);

    register_vector<long>("VectorLong");

    class_<GritVM>("GritVM")
        .constructor<>()
        .function("load", &GritVM::load)
        .function("loadFromString", &GritVM::loadFromString)
        .function("run", &GritVM::run)
        .function("step", &GritVM::step)
        .function("reset", &GritVM::reset)
        .function("getDataMem", &GritVM::getDataMem)
        .function("getAccumulator", &GritVM::getAccumulator)
        .function("getMachineStatus", &GritVM::getMachineStatus)
        .function("getCurrentInstructionIndex", &GritVM::getCurrentInstructionIndex);
}