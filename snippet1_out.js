=== SNIPPET 3 REGEX OUTPUT ===
/* main body */

    console.log("n", "Math.log(n)", "n", "n^2", "n^n", "e^n");

    console.log("---------------------------------------------------------------");

    for (let n = Math.trunc(1); n <= 10; n++) {
        let logn = Math.log(n);
        let square = Math.pow(n, 2);
        let nn = Math.pow(n, n);
        let en = Math.exp(n);

        console.log(n, logn, n, square, nn, en);
    }

    // return 0;

/* end main */
