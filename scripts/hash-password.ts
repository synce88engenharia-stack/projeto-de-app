import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Uso: npx tsx scripts/hash-password.ts <senha>");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
  console.log(
    "\nAo colar em .env, escape todo '$' como '\\$' (Next.js expande $VAR em arquivos .env):"
  );
  console.log(`ADMIN_PASSWORD_HASH="${hash.replaceAll("$", "\\$")}"`);
});
