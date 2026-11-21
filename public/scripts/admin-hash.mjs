import { randomBytes, scryptSync } from 'node:crypto'
let password = ''
for await (const chunk of process.stdin) password += chunk
password = password.replace(/[\r\n]+$/, '')
if (password.length < 14) {
  console.error('Folosește o parolă de minimum 14 caractere, citită din stdin.')
  process.exit(1)
}
const salt = randomBytes(16).toString('hex')
console.log(salt + ':' + scryptSync(password, salt, 64).toString('hex'))
