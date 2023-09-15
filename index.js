import express from "express"
import { existsSync, writeFileSync, readFileSync } from "fs"
import cors from "cors"
// import multer from "multer"
import nodemailer from "nodemailer"
import "dotenv/config"

const port = process.env.PORT
const server = express()
// const upload = multer({ dest: "uploads/" })

const seatsDataUrl = "./data/seats.json"
if (!existsSync(seatsDataUrl)) {
  writeFileSync(seatsDataUrl, "[]", "utf8")
}
const seats = JSON.parse(readFileSync(seatsDataUrl, "utf8"))
const seatsApiUrl = "/api/seats"

function resetSeats() {
  seats.splice(0)
  // console.log(seats)
  for (let i = 1; i < 13; i++) {
    seats.push({ id: i, type: "Oberschicht", reserved: false, price: 16 })
  }

  for (let i = 1; i < 13; i++) {
    seats.push({ id: 12 + i, type: "Unterschicht", reserved: false, price: 12 })
  }
  writeFileSync(seatsDataUrl, JSON.stringify(seats, null, 2), "utf8")
}
resetSeats()

server.use(cors())
server.use(express.json())

server.get(seatsApiUrl, (_, res) => {
  res.json(seats)
})

server.post(seatsApiUrl, (req, res) => {
  const seat = req.body

  const index = seats.findIndex((item) => item.id === seat.id)
  seats[index].reserved = true

  writeFileSync(seatsDataUrl, JSON.stringify(seats, null, 2), "utf8")
  informOwner(seat)

  res.status(201).end()
})

server.delete(seatsApiUrl, (_, res) => {
  resetSeats()
  res.status(201).end()
})

function informOwner(data) {
  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.SECRET_USER,
      pass: process.env.SECRET_KEY,
    },
  })
  const mail = {
    from: "system@kino-wien.de",
    to: "owner@kino-wien.de",
    subject: `Seat ${data.id} reserved`,
    text: `Congrats you just made ${data.price}€`,
    html: `<p>Congrats you just made <b>${data.price}€</b></p>`,
  }
  transport.sendMail(mail)
}

server.listen(port, () => console.log("Server running at port ", port))
