// === SNIPPET 2 REGEX OUTPUT ===
// // Function to count frequencies of array items

function countFreq(arr, n) {
    let freq = new Map();

    for (let i = Math.trunc(0); i < n; i++)
        freq[arr[i]]++;

    for (let x of freq)
        console.log(x[0], " occurs ", x[1], " times.");
}
/* main body */

    let arr = [10, 20, 20, 10, 10, 20, 5, 20];
    let n = sizeof(arr) / sizeof(arr[0]);

    countFreq(arr, n);

    // return 0;

/* end main */
