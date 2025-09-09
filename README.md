# GritVM_Interactive

<img width="1583" height="1058" alt="image" src="https://github.com/user-attachments/assets/8da88803-8f56-4d03-8937-fb8c0c01e3ca" />

An interactive, browser-based IDE for the Grit Virtual Machine (GritVM) - a custom assembly interpreter written in C++ and compiled to WebAssembly (Wasm).

---

This project brings the **Grit Virtual Machine (GritVM)**, originally written in C++, into the browser as an interactive IDE.
By compiling the interpreter with **Emscripten** into **WebAssembly (Wasm)** and pairing it with a **React frontend**, users can write, run, and debug GritVM assembly code directly in the browser.

---

## Overview

The application consists of:

* **C++ Core (Interpreter)**
  Implements the GritVM instruction set, memory model, and execution logic.

  * `GritVMWeb.cpp/.hpp`: Web-compatible VM implementation with string loading and step execution
  * `GritVMBase.cpp/.hpp`: Instruction parsing, status conversion, helper utilities
  * `GritVMBindings.cpp`: Emscripten bindings to expose C++ methods to JavaScript

* **Frontend (React IDE)**
  An interactive IDE with step-by-step debugging, code editing, and state visualization.

  * `frontend.js`: React component implementing the editor, controls, and VM state monitor

---

## Features

* Load GritVM assembly programs from text
* Run or step through instructions
* Live visualization of:

  * Accumulator value
  * Data memory
  * Current instruction pointer
  * Execution status (WAITING, READY, RUNNING, HALTED, ERRORED)
* Error detection for invalid instructions and memory access
* Example programs: factorial calculator, sum from 1 to N, arithmetic tests

---

## Project Structure

```
gritvm-web/
├── cpp/
│   ├── GritVMBase.hpp
│   ├── GritVMBase.cpp
│   ├── GritVMWeb.hpp
│   ├── GritVMWeb.cpp
│   ├── GritVMBindings.cpp
│
├── frontend/
│   └── frontend.js        # React IDE
│
├── build/                 # Generated Wasm output
│   ├── gritvm.js
│   └── gritvm.wasm
```

---

## Setup and Installation

### 1. Prerequisites

* [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
* Node.js 16+ and npm

### 2. Compile C++ to WebAssembly

In the `cpp/` directory:

```bash
source /path/to/emsdk/emsdk_env.sh

emcc -O3 --bind -o ../build/gritvm.js \
     GritVMWeb.cpp GritVMBase.cpp GritVMBindings.cpp \
     -s MODULARIZE=1 \
     -s EXPORT_NAME="GritVMModule" \
     -s ALLOW_MEMORY_GROWTH=1 \
     -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'
```

This generates `gritvm.js` and `gritvm.wasm` in `build/`.

### 3. Setup React Frontend

```bash
cd frontend
npx create-react-app gritvm-ide
cd gritvm-ide
npm install lucide-react
```

Copy the compiled `gritvm.js` and `gritvm.wasm` into the frontend `public/` folder.

### 4. Run Locally

```bash
npm start
```

Visit `http://localhost:3000` in your browser.

---

## Usage

* Write or paste GritVM assembly into the editor
* Enter initial memory values (comma-separated)
* Use **Run** to execute continuously or **Step** to advance one instruction at a time
* Monitor VM state in the right panel:

  * Status (WAITING, READY, RUNNING, HALTED, ERRORED)
  * Accumulator value
  * Current instruction index
  * Data memory contents

---

## Example Programs

### Factorial Calculator

```
CHECKMEM 1
CLEAR
ADDCONST 1
INSERT 1
INSERT 2

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
JUMPREL -11
```

### Sum 1 to N

```
CHECKMEM 1
CLEAR
INSERT 1
AT 0
JUMPNZERO 2
HALT

CLEAR
ADDCONST 1
INSERT 2

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
JUMPREL -11
```

---

## Deployment

1. Push the project to GitHub
2. Import repository into [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com)
3. Deploy with automatic React build detection
4. Access your live IDE in the browser

---

## License

MIT License © 2025

---


