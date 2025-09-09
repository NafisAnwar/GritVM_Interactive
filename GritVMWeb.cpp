#include "GritVMWeb.hpp"
#include <iostream>
#include <fstream>
#include <sstream>
#include <stdexcept>

GritVM::GritVM() : accumulator(0), machineStatus(WAITING), currentInstructIndex(0) {}

STATUS GritVM::load(const std::string filename, const std::vector<long>& initialMemory) {
    if (machineStatus != WAITING) {
        return machineStatus;
    }

    std::ifstream file(filename);
    if (!file) {
        throw std::runtime_error("could not open file: " + filename);
    }

    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    return loadFromString(content, initialMemory);
}

STATUS GritVM::loadFromString(const std::string& gvmCode, const std::vector<long>& initialMemory) {
    if (machineStatus != WAITING) {
        return machineStatus;
    }

    instructMem.clear();
    loadInstructions(gvmCode);

    if (instructMem.empty()) {
        machineStatus = WAITING;
        return machineStatus;
    }

    dataMem = initialMemory;
    accumulator = 0;
    machineStatus = READY;
    currentInstructIndex = 0;
    return machineStatus;
}

void GritVM::loadInstructions(const std::string& code) {
    std::stringstream ss(code);
    std::string line;

    while (std::getline(ss, line)) {
        // Remove leading/trailing whitespace
        line.erase(0, line.find_first_not_of(" \t\r\n"));
        line.erase(line.find_last_not_of(" \t\r\n") + 1);
        
        if (line.empty() || line[0] == '#') continue;
        
        instructMem.push_back(GVMHelper::parseInstruction(line));
    }
}

STATUS GritVM::run() {
    if (machineStatus != READY) {
        return machineStatus;
    }

    machineStatus = RUNNING;

    while (machineStatus == RUNNING && currentInstructIndex < static_cast<int>(instructMem.size())) {
        long jumpDistance = evaluate(instructMem[currentInstructIndex]);
        advance(jumpDistance);
    }

    return machineStatus;
}

STATUS GritVM::step() {
    if (machineStatus != READY && machineStatus != RUNNING) {
        return machineStatus;
    }

    machineStatus = RUNNING;

    if (currentInstructIndex < static_cast<int>(instructMem.size())) {
        long jumpDistance = evaluate(instructMem[currentInstructIndex]);
        advance(jumpDistance);
    } else {
        machineStatus = HALTED;
    }

    return machineStatus;
}

long GritVM::evaluate(Instruction inst) {
    switch (inst.operation) {
        case CLEAR:
            accumulator = 0;
            return 1;

        case AT:
            if (inst.argument >= 0 && inst.argument < static_cast<long>(dataMem.size())) {
                accumulator = dataMem[inst.argument];
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case SET:
            if (inst.argument >= 0 && inst.argument < static_cast<long>(dataMem.size())) {
                dataMem[inst.argument] = accumulator;
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case INSERT:
            if (inst.argument >= 0 && inst.argument <= static_cast<long>(dataMem.size())) {
                dataMem.insert(dataMem.begin() + inst.argument, accumulator);
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case ERASE:
            if (inst.argument >= 0 && inst.argument < static_cast<long>(dataMem.size())) {
                dataMem.erase(dataMem.begin() + inst.argument);
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case ADDCONST:
            accumulator += inst.argument;
            return 1;

        case SUBCONST:
            accumulator -= inst.argument;
            return 1;

        case MULCONST:
            accumulator *= inst.argument;
            return 1;

        case DIVCONST:
            if (inst.argument == 0) {
                machineStatus = ERRORED;
                return 0;
            }
            accumulator /= inst.argument;
            return 1;

        case ADDMEM:
            if (inst.argument >= 0 && inst.argument < static_cast<long>(dataMem.size())) {
                accumulator += dataMem[inst.argument];
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case SUBMEM:
            if (inst.argument >= 0 && inst.argument < static_cast<long>(dataMem.size())) {
                accumulator -= dataMem[inst.argument];
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case MULMEM:
            if (inst.argument >= 0 && inst.argument < static_cast<long>(dataMem.size())) {
                accumulator *= dataMem[inst.argument];
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case DIVMEM:
            if (inst.argument >= 0 && inst.argument < static_cast<long>(dataMem.size())) {
                if (dataMem[inst.argument] == 0) {
                    machineStatus = ERRORED;
                    return 0;
                }
                accumulator /= dataMem[inst.argument];
            } else {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        case JUMPREL:
            if (inst.argument == 0) {
                machineStatus = ERRORED;
                return 0;
            }
            return inst.argument;

        case JUMPZERO:
            if (inst.argument == 0) {
                machineStatus = ERRORED;
                return 0;
            }
            if (accumulator == 0) {
                return inst.argument;
            }
            return 1;

        case JUMPNZERO:
            if (inst.argument == 0) {
                machineStatus = ERRORED;
                return 0;
            }
            if (accumulator != 0) {
                return inst.argument;
            }
            return 1;

        case NOOP:
            return 1;

        case HALT:
            machineStatus = HALTED;
            return 0;

        case OUTPUT:
            std::cout << "output: " << accumulator << std::endl;
            return 1;

        case CHECKMEM:
            if (inst.argument > static_cast<long>(dataMem.size())) {
                machineStatus = ERRORED;
                return 0;
            }
            return 1;

        default:
            machineStatus = ERRORED;
            return 0;
    }
}

void GritVM::advance(long jump) {
    if (jump == 0 || machineStatus == ERRORED) {
        return;
    }

    currentInstructIndex += static_cast<int>(jump);

    if (currentInstructIndex >= static_cast<int>(instructMem.size()) || currentInstructIndex < 0) {
        machineStatus = HALTED;
    }
}

std::vector<long> GritVM::getDataMem() {
    return dataMem;
}

STATUS GritVM::reset() {
    accumulator = 0;
    instructMem.clear();
    dataMem.clear();
    currentInstructIndex = 0;
    machineStatus = WAITING;
    return machineStatus;
}

long GritVM::getAccumulator() const {
    return accumulator;
}

STATUS GritVM::getMachineStatus() const {
    return machineStatus;
}

int GritVM::getCurrentInstructionIndex() const {
    return currentInstructIndex;
}