export const getRandomNumberByRange = (start: number, end: number): number => {
    return Math.round(Math.random() * (end - start) + start);
}

export const sum = (x: number, y: number):number => {
    return x + y
}

export const square = (x: number): number => {
    return x * x
}
