#ifndef GRITVM_WEB_HPP
#define GRITVM_WEB_HPP

#include "GritVMBase.hpp"
#include <vector>
#include <string>

class GritVM {
public:
    GritVM();
    
    // Original functions (for file compatibility)
    STATUS load(const std::string filename, const std::vector<long>& initialMemory);
    STATUS run();
    std::vector<long> getDataMem();
    STATUS reset();
    
    // New web-specific functions
    STATUS loadFromString(const std::string& gvmCode, const std::vector<long>& initialMemory);
    STATUS step();
    long getAccumulator() const;
    STATUS getMachineStatus() const;
    int getCurrentInstructionIndex() const;

private:
    long accumulator;
    STATUS machineStatus;
    std::vector<Instruction> instructMem;
    int currentInstructIndex;
    std::vector<long> dataMem;
    
    long evaluate(Instruction inst);
    void advance(long jump);
    void loadInstructions(const std::string& code);
};

#endif