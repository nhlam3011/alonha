import { updateProfileSchema } from "./lib/validations.js";

const test1 = updateProfileSchema.safeParse({ name: "Admin", phone: "0123", avatar: "/uploads/image.jpg" });
console.log("Test 1 (relative):", test1.success ? "OK" : test1.error.format());

const test2 = updateProfileSchema.safeParse({ name: "Admin", phone: "0123", avatar: "http://example.com/a.jpg" });
console.log("Test 2 (http):", test2.success ? "OK" : test2.error.format());

const test3 = updateProfileSchema.safeParse({ name: "Admin", phone: null, avatar: null });
console.log("Test 3 (nulls):", test3.success ? "OK" : test3.error.format());

const test4 = updateProfileSchema.safeParse({ name: "Admin", phone: "0123", avatar: "" });
console.log("Test 4 (empty string):", test4.success ? "OK" : test4.error.format());

const test5 = updateProfileSchema.safeParse({ name: "", phone: "0123", avatar: null });
console.log("Test 5 (empty name):", test5.success ? "OK" : test5.error.format());
