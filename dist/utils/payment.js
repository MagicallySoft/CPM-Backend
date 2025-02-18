"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPayment = void 0;
const processPayment = (paymentDetails, subscriptionPlan) => __awaiter(void 0, void 0, void 0, function* () {
    // Simulate a successful payment result for testing purposes
    return {
        success: true, // or false in case of a failure
        transactionData: {
            transactionId: "fake-transaction-id",
            amount: 100,
            currency: "USD",
            status: "approved",
        },
        error: null, // On success, there will be no error
    };
});
exports.processPayment = processPayment;
