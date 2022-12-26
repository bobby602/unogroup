class AppError extends Error {
    constructor(message,status){
        super();
        this.message = message;
        this.status = status ;
        console.log(this);
    }
}

module.exports = AppError;