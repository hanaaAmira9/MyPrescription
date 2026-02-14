function executePromise() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("inside promise");
            resolve("hello");
        }, 2000);
    });
}

executePromise().then(msg => console.log(msg));
