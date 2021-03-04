

export function parseMultiplexedResponse(data: string): Array<any> {
    const compiledData: Array<Array<string>> = [];
    const lines = data.split("\n");
    for (let line of lines) {
        if(line.trim().length == 0) continue;
        const lineSplit = line.split(":");
        const index = parseInt(lineSplit[0]);
        const type = lineSplit[1];
        if (compiledData[index] === undefined) {
            compiledData[index] = [];
        }
        if (type === "DATA") {
            const lineData = lineSplit.slice(2).join(":");
            compiledData[index].push(lineData);
        }
    }

    return compiledData.map((d) => {
        // For tests, this assumption is good enough
        const isJson = d[0].startsWith("[{");
        const isArray = d[0].startsWith("[[");        
        
        if (!isJson && !isArray) {
            return d.join("");
        }

        let objResponse: Array<any> = [];
        for (let el of d) {
            const parsedEl = JSON.parse(el) as Array<any>;
            objResponse = objResponse.concat(parsedEl);
        }
        return objResponse;
    });
}