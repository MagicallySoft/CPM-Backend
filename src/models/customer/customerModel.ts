// models/Customer.ts
import mongoose, { Schema, Document } from "mongoose";
import {
  encryptData,
  decryptData,
  computeBlindIndex,
} from "../../utils/encryption";

/**
 * Customer data interface.
 * Note: dynamicFields and products can hold additional dynamic data.
 */
export interface ICustomerData {
  companyName: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  tallySerialNo: string;
  prime: boolean;
  blacklisted: boolean;
  remark?: string;
  products?: Array<{ [key: string]: any }>;
  dynamicFields?: { [key: string]: any };
}

export interface ICustomer extends Document {
  adminId: mongoose.Types.ObjectId;
  keyId?: mongoose.Types.ObjectId;
  encryptedData: string;
  mobileNumberIndex: string;
  contactPersonIndex: string;
  companyNameIndex: string;
  emailIndex: string;
  tallySerialNoIndex: string;
  nextRenewalDate?: Date[];
  data: ICustomerData;
}

const CustomerSchema: Schema<ICustomer> = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    keyId: { type: Schema.Types.ObjectId, required: false },
    encryptedData: { type: String, required: true },
    mobileNumberIndex: { type: String, required: true, index: true },
    contactPersonIndex: { type: String, required: true, index: true },
    companyNameIndex: { type: String, required: true, index: true },
    emailIndex: { type: String, required: true, index: true },
    tallySerialNoIndex: { type: String, required: true, index: true },
    nextRenewalDate: { type: [Date], index: true },
  },
  { timestamps: true }
);

// Virtual field "data" handles encryption on set and decryption on get.
CustomerSchema.virtual("data")
  .get(function (this: ICustomer) {
    try {
      return JSON.parse(decryptData(this.encryptedData));
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt customer data.");
    }
  })
  .set(function (this: ICustomer, value: ICustomerData) {
    this.encryptedData = encryptData(JSON.stringify(value));
    this.mobileNumberIndex = computeBlindIndex(value.mobileNumber);
    this.contactPersonIndex = computeBlindIndex(value.contactPerson);
    this.companyNameIndex = computeBlindIndex(value.companyName);
    this.emailIndex = computeBlindIndex(value.email);
    this.tallySerialNoIndex = computeBlindIndex(value.tallySerialNo);
  });

// Pre-save hook to recalc blind indexes and compute next renewal date
CustomerSchema.pre<ICustomer>("save", function (next) {
  try {
    const data: ICustomerData = JSON.parse(decryptData(this.encryptedData));
    this.mobileNumberIndex = computeBlindIndex(data.mobileNumber);
    this.contactPersonIndex = computeBlindIndex(data.contactPerson);
    this.companyNameIndex = computeBlindIndex(data.companyName);
    this.emailIndex = computeBlindIndex(data.email);
    this.tallySerialNoIndex = computeBlindIndex(data.tallySerialNo);

    // If products have a renewalDate, set the nextRenewalDate for faster queries.
    if (data.products && Array.isArray(data.products)) {
      const renewalDates = data.products
        .filter((p: any) => p.renewalDate)
        .map((p: any) => new Date(p.renewalDate));
      if (renewalDates.length > 0) {
        this.nextRenewalDate = renewalDates;
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);
export default Customer;

















// // models/customer/customerModel.ts
// import mongoose, { Schema, Document } from "mongoose";

// export interface ICustomerData {
//   companyName: string;
//   contactPerson: string;
//   mobileNumber: string;
//   email: string;
//   tallySerialNo: string;
//   prime: boolean;
//   blacklisted: boolean;
//   remark?: string;
//   products?: Array<{ [key: string]: any }>;
//   dynamicFields?: { [key: string]: any };
// }

// export interface ICustomer extends Document, ICustomerData {
//   adminId: mongoose.Types.ObjectId;
//   nextRenewalDate?: Date;
// }

// const CustomerSchema: Schema<ICustomer> = new Schema(
//   {
//     adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     companyName: { type: String, required: true },
//     contactPerson: { type: String, required: true },
//     mobileNumber: { type: String, required: true },
//     email: { type: String, required: true },
//     tallySerialNo: { type: String, required: true },
//     prime: { type: Boolean, required: true },
//     blacklisted: { type: Boolean, required: true },
//     remark: { type: String },
//     products: { type: [Schema.Types.Mixed] },
//     dynamicFields: { type: Schema.Types.Mixed },
//     nextRenewalDate: { type: Date, index: true },
//   },
//   { timestamps: true }
// );

// // Optional: Update nextRenewalDate based on the earliest renewalDate in products.
// CustomerSchema.pre<ICustomer>("save", function (next) {
//   if (this.products && Array.isArray(this.products)) {
//     const renewalDates = this.products
//       .filter((p: any) => p.renewalDate)
//       .map((p: any) => new Date(p.renewalDate).getTime());
//     if (renewalDates.length > 0) {
//       this.nextRenewalDate = new Date(Math.min(...renewalDates));
//     }
//   }
//   next();
// });

// const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);
// export default Customer;
