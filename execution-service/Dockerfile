FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install essential compilation tools, LLVM/Clang, LLDB, and Python3
RUN apt-get update && \
    apt-get install -y build-essential clang lldb python3 python3-lldb curl gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js (v20)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Set up working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy source code and scripts
COPY . .

# Expose the API port
EXPOSE 3000

# Run the execution API
CMD ["npm", "start"]
