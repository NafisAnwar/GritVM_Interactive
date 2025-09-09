import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, ChevronRight, Cpu, Database, AlertCircle } from 'lucide-react';

const GritVMIDE = () => {
    const [gvmCode, setGvmCode] = useState(`# Test Program for functions of the GritVM
# Requires 1 memory location with some int

# Check memory, clear the accumulator
CHECKMEM 1
CLEAR

# Make the number 35
ADDCONST 50
SUBCONST 5
MULCONST 7
DIVCONST 9

# Make that 35 around the 10 in 0, resulting in [35, N, 35]
INSERT 0
INSERT 2

# Add 4 to our 0 memory location, insert 3 into location 3
ADDCONST 4
SET 0
CLEAR
ADDCONST 3
INSERT 3

# Use that 3 and do some maths
AT 0
DIVMEM 3
ADDMEM 0
SUBMEM 2
MULMEM 3

HALT`);

    const [initialMemory, setInitialMemory] = useState("10");
    const [machineState, setMachineState] = useState({
        dataMem: [],
        accumulator: 0,
        status: 'WAITING',
        currentLine: 0,
    });
    
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState([]);
    const [error, setError] = useState("");
    const vmRef = useRef(null);
    const runIntervalRef = useRef(null);

    // Mock GritVM for demonstration since we can't load actual WASM
    const mockVM = useRef({
        currentLine: 0,
        accumulator: 0,
        dataMem: [],
        status: 0, // WAITING
        instructions: [],
        
        loadFromString: function(code, memory) {
            this.instructions = code.split('\n')
                .map((line, i) => ({ line: line.trim(), index: i }))
                .filter(inst => inst.line && !inst.line.startsWith('#'));
            this.dataMem = [...memory];
            this.accumulator = 0;
            this.currentLine = 0;
            this.status = 1; // READY
            return { value: 1 };
        },
        
        step: function() {
            if (this.currentLine >= this.instructions.length) {
                this.status = 3; // HALTED
                return { value: 3 };
            }
            
            const inst = this.instructions[this.currentLine];
            const parts = inst.line.split(' ');
            const op = parts[0];
            const arg = parseInt(parts[1]) || 0;
            
            this.status = 2; // RUNNING
            
            // Simulate some operations
            switch(op) {
                case 'CLEAR':
                    this.accumulator = 0;
                    break;
                case 'ADDCONST':
                    this.accumulator += arg;
                    break;
                case 'SUBCONST':
                    this.accumulator -= arg;
                    break;
                case 'MULCONST':
                    this.accumulator *= arg;
                    break;
                case 'DIVCONST':
                    if (arg !== 0) this.accumulator = Math.floor(this.accumulator / arg);
                    break;
                case 'SET':
                    if (arg < this.dataMem.length) this.dataMem[arg] = this.accumulator;
                    break;
                case 'AT':
                    if (arg < this.dataMem.length) this.accumulator = this.dataMem[arg];
                    break;
                case 'INSERT':
                    this.dataMem.splice(arg, 0, this.accumulator);
                    break;
                case 'HALT':
                    this.status = 3; // HALTED
                    return { value: 3 };
                default:
                    break;
            }
            
            this.currentLine++;
            return { value: this.status };
        },
        
        getAccumulator: function() { return this.accumulator; },
        getMachineStatus: function() { return { value: this.status }; },
        getCurrentInstructionIndex: function() { return this.currentLine; },
        getDataMem: function() {
            return {
                size: () => this.dataMem.length,
                get: (i) => this.dataMem[i] || 0
            };
        },
        reset: function() {
            this.currentLine = 0;
            this.accumulator = 0;
            this.dataMem = [];
            this.status = 0; // WAITING
            this.instructions = [];
        }
    });

    useEffect(() => {
        vmRef.current = mockVM.current;
        updateMachineState();
    }, []);

    const updateMachineState = () => {
        if (vmRef.current) {
            const vm = vmRef.current;
            const statusMap = ['WAITING', 'READY', 'RUNNING', 'HALTED', 'ERRORED'];

            const memVector = vm.getDataMem();
            const memArray = [];
            for (let i = 0; i < memVector.size(); i++) {
                memArray.push(memVector.get(i));
            }

            setMachineState({
                dataMem: memArray,
                accumulator: vm.getAccumulator(),
                status: statusMap[vm.getMachineStatus().value],
                currentLine: vm.getCurrentInstructionIndex(),
            });
        }
    };

    const handleRun = () => {
        if (isRunning) return;
        
        const vm = vmRef.current;
        if (!vm) return;

        try {
            const memoryArray = initialMemory.split(',')
                .map(n => parseInt(n.trim()))
                .filter(n => !isNaN(n));

            vm.loadFromString(gvmCode, memoryArray);
            setIsRunning(true);
            setError("");

            runIntervalRef.current = setInterval(() => {
                const status = vm.step();
                updateMachineState();
                
                if (status.value === 3 || status.value === 4) { // HALTED or ERRORED
                    clearInterval(runIntervalRef.current);
                    setIsRunning(false);
                }
            }, 200);
        } catch (err) {
            setError(`Runtime error: ${err.message}`);
        }
    };
    
    const handleStep = () => {
        if (isRunning) return;
        
        const vm = vmRef.current;
        if (!vm) return;
        
        try {
            if (vm.getMachineStatus().value === 0) { // WAITING
                const memoryArray = initialMemory.split(',')
                    .map(n => parseInt(n.trim()))
                    .filter(n => !isNaN(n));
                vm.loadFromString(gvmCode, memoryArray);
            }
            vm.step();
            updateMachineState();
            setError("");
        } catch (err) {
            setError(`Step error: ${err.message}`);
        }
    };

    const handleReset = () => {
        if (runIntervalRef.current) {
            clearInterval(runIntervalRef.current);
        }
        setIsRunning(false);
        
        if (vmRef.current) {
            vmRef.current.reset();
            updateMachineState();
        }
        setOutput([]);
        setError("");
    };

    const handleStop = () => {
        if (runIntervalRef.current) {
            clearInterval(runIntervalRef.current);
        }
        setIsRunning(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'WAITING': return 'text-gray-500';
            case 'READY': return 'text-blue-500';
            case 'RUNNING': return 'text-green-500';
            case 'HALTED': return 'text-orange-500';
            case 'ERRORED': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const codeLines = gvmCode.split('\n');

    return (
        <div className="flex h-screen bg-gray-100 font-mono">
            {/* Left Panel - Code Editor */}
            <div className="flex-1 flex flex-col bg-white border-r">
                <div className="bg-gray-800 text-white p-2 text-sm font-bold">
                    GritVM Assembly Editor
                </div>
                
                {/* Code Editor Area */}
                <div className="flex-1 relative">
                    <div className="absolute inset-0 flex">
                        {/* Line Numbers */}
                        <div className="bg-gray-50 border-r px-2 py-2 text-sm text-gray-500 select-none">
                            {codeLines.map((_, i) => (
                                <div 
                                    key={i}
                                    className={`leading-6 ${i === machineState.currentLine ? 'bg-yellow-200 font-bold' : ''}`}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                        
                        {/* Code Area */}
                        <div className="flex-1">
                            <textarea
                                value={gvmCode}
                                onChange={(e) => setGvmCode(e.target.value)}
                                className="w-full h-full p-2 text-sm font-mono resize-none border-none outline-none leading-6"
                                style={{ minHeight: '100%' }}
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Controls */}
                <div className="bg-gray-50 border-t p-3 space-y-3">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                        >
                            <Play size={16} />
                            <span>Run</span>
                        </button>
                        
                        <button
                            onClick={handleStep}
                            disabled={isRunning}
                            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                        >
                            <ChevronRight size={16} />
                            <span>Step</span>
                        </button>
                        
                        <button
                            onClick={handleStop}
                            disabled={!isRunning}
                            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                        >
                            <Square size={16} />
                            <span>Stop</span>
                        </button>
                        
                        <button
                            onClick={handleReset}
                            className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                            <RotateCcw size={16} />
                            <span>Reset</span>
                        </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Initial Memory:</label>
                        <input 
                            type="text" 
                            value={initialMemory} 
                            onChange={(e) => setInitialMemory(e.target.value)}
                            placeholder="e.g., 10, 5, 3"
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            disabled={isRunning}
                        />
                    </div>
                    
                    {error && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - VM State Visualizer */}
            <div className="w-96 bg-white flex flex-col">
                <div className="bg-gray-800 text-white p-2 text-sm font-bold">
                    VM State Monitor
                </div>
                
                <div className="flex-1 p-4 overflow-auto space-y-4">
                    {/* Machine Status */}
                    <div className="bg-gray-50 rounded p-3">
                        <div className="flex items-center space-x-2 mb-2">
                            <Cpu size={18} />
                            <h3 className="font-bold text-sm">Machine Status</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={`font-bold ${getStatusColor(machineState.status)}`}>
                                    {machineState.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Accumulator:</span>
                                <span className="font-mono bg-blue-100 px-1 rounded">
                                    {machineState.accumulator}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Current Line:</span>
                                <span className="font-mono bg-yellow-100 px-1 rounded">
                                    {machineState.currentLine + 1}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Data Memory */}
                    <div className="bg-gray-50 rounded p-3">
                        <div className="flex items-center space-x-2 mb-2">
                            <Database size={18} />
                            <h3 className="font-bold text-sm">Data Memory</h3>
                        </div>
                        
                        {machineState.dataMem.length === 0 ? (
                            <div className="text-gray-500 text-sm italic">No data in memory</div>
                        ) : (
                            <div className="grid grid-cols-4 gap-1">
                                {machineState.dataMem.map((value, index) => (
                                    <div key={index} className="bg-white border rounded p-2 text-center">
                                        <div className="text-xs text-gray-500">[{index}]</div>
                                        <div className="font-mono font-bold text-sm">{value}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sample Programs */}
                    <div className="bg-gray-50 rounded p-3">
                        <h3 className="font-bold text-sm mb-2">Sample Programs</h3>
                        <div className="space-y-1">
                            <button 
                                onClick={() => setGvmCode(`# Calculate factorial of N
CHECKMEM 1
CLEAR
ADDCONST 1
INSERT 1
INSERT 2

# Main loop
AT 0
ADDCONST 1
SUBMEM 2
JUMPNZERO 2
HALT

AT 1
MULMEM 2
SET 1
AT 2
ADDCONST 1
SET 2
JUMPREL -11`)}
                                className="block w-full text-left text-xs bg-white hover:bg-blue-50 border rounded p-2"
                            >
                                Factorial Calculator
                            </button>
                            
                            <button 
                                onClick={() => setGvmCode(`# Sum from 1 to N
CHECKMEM 1
CLEAR
INSERT 1
AT 0
JUMPNZERO 2
HALT

CLEAR
ADDCONST 1
INSERT 2

# Loop
AT 0
ADDCONST 1
SUBMEM 2
JUMPNZERO 2
HALT

AT 1
ADDMEM 2
SET 1
AT 2
ADDCONST 1
SET 2
JUMPREL -11`)}
                                className="block w-full text-left text-xs bg-white hover:bg-blue-50 border rounded p-2"
                            >
                                Sum 1 to N
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GritVMIDE;