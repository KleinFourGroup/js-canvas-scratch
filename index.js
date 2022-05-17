// Canvases

const canvas = document.querySelector("canvas")
const offCanvas= document.createElement('canvas')

const ctx = canvas.getContext("2d")
const offCtx = offCanvas.getContext("2d")

let intensity = 0.5

let textData

let letterData = []
let letterImages = []

// Timing

let startTick, prev

let tickLength = 3

// Misc

function roundTo(num, places) {
    return (Math.round(num * (10 ** places)) / (10 ** places)).toFixed(places)
}

// Colors

let red = 1
let green = 1
let blue = 1

function rgbFloor(val) {
    let ret = Math.floor(val * 256)
    if (ret >= 255) return 255
    return ret
}

function getColor() {
    return `rgb(${rgbFloor(red)}, ${rgbFloor(green)}, ${rgbFloor(blue)})`
}

function getInvColor() {
    return `rgb(${rgbFloor(1 - red)}, ${rgbFloor(1 - green)}, ${rgbFloor(1 - blue)})`
}

let vRed = 1
let vGreen = 1
let vBlue = 1

function updateColors(delta) {
    red += vRed * delta * interpolateIntensity(0.5, 5)

    if (red > 1) {
        red = 1
        vRed *= -1
    } else if (red < 0) {
        red = 0
        vRed *= -1
    }
    green += vGreen * delta * interpolateIntensity(0.5, 5)
    if (green > 1) {
        green = 1
        vGreen *= -1
    } else if (green < 0) {
        green = 0
        vGreen *= -1
    }
    blue += vBlue * delta * interpolateIntensity(0.5, 5)
    if (blue > 1) {
        blue = 1
        vBlue *= -1
    } else if (blue < 0) {
        blue = 0
        vBlue *= -1
    }
}

canvas.width = innerWidth
canvas.height = innerHeight
offCanvas.width = 1000
offCanvas.height = 1000

// ctx.fillText('Hello world', 0, 10);

const fonts = ["serif", "sans-serif", "monospace", "cursive", "fantasy"]

function interpolateIntensity(lo, hi) {
    let frac = (intensity - 0.5) / 9.5
    return lo + (hi - lo) * frac
}

class TextStyle {
    constructor() {
        this.size = 48
        this.font = "serif"
        this.bold = false
        this.italics = false
        this.smallCaps = false
        this.stroke = false
    }

    randomize() {
        this.size = Math.floor(30 + 16 * Math.random())
        this.font = fonts[Math.floor(fonts.length * Math.random())]
        this.bold = (Math.random() <= interpolateIntensity(0.3, 0.5))
        this.italics = (Math.random() <= interpolateIntensity(0.3, 0.5))
        this.smallCaps = (Math.random() <= interpolateIntensity(0.2, 0.5))
        this.stroke = (Math.random() <= interpolateIntensity(0.1, 0.5))
    }

    toString() {
        let prefix = ""

        if (this.bold) prefix += "bold "
        if (this.italics) prefix += "italic "
        if (this.smallCaps) prefix += "small-caps "
        return `${prefix}${this.size}px ${this.font}`
    }
}

class TextImage {
    constructor(imageData, heightAbove, heightBelow) {
        this.imageData = imageData
        this.heightAbove = heightAbove
        this.heightBelow = heightBelow
    }
}

function getTextImage(txt, style) {
    let textWidth, textHeight
    if (textData !== undefined) {
        textWidth = textData.actualBoundingBoxLeft + textData.actualBoundingBoxRight
        textHeight = textData.actualBoundingBoxAscent + textData.actualBoundingBoxDescent
        offCtx.clearRect(0, 0, textWidth, textHeight)
    }

    offCtx.font = style.toString()

    if (txt !== " ") textData = offCtx.measureText(txt)
    else textData = offCtx.measureText("?")

    textWidth = textData.actualBoundingBoxLeft + textData.actualBoundingBoxRight
    textHeight = textData.actualBoundingBoxAscent + textData.actualBoundingBoxDescent

    offCtx.fillStyle = getColor()
    offCtx.fillRect(0, 0, textWidth, textHeight)
    offCtx.strokeStyle = getInvColor()
    offCtx.fillStyle = getInvColor()
    if (style.stroke) offCtx.strokeText(txt, textData.actualBoundingBoxLeft, textData.actualBoundingBoxAscent)
    else offCtx.fillText(txt, textData.actualBoundingBoxLeft, textData.actualBoundingBoxAscent)


    let textImage = new TextImage(offCtx.getImageData(0, 0, textWidth, textHeight), textData.actualBoundingBoxAscent, textData.actualBoundingBoxDescent)

    return textImage
}

class DisplayMessage {
    constructor() {
        this.message = undefined
        this.letters = []
        this.images = []
    }

    setText(txt) {
        if (txt !== this.message) {
            this.message = txt

            for (let i = 0; i < this.message.length; i++) {
                let ch = this.message.charAt(i)
        
                this.letters.push([ch, new TextStyle()])
                // (getTextImage(ch))
            }
        } else {
            for (let i = 0; i < this.letters.length; i++) {
                let letter = this.letters[i]
                if ((Math.random() <= interpolateIntensity(0.05, 1))) letter[1].randomize()
            }
        }
        // console.log(this.letters)
    }

    getImages() {
        this.images = []

        for (let i = 0; i < this.letters.length; i++) {
            let ch = this.letters[i][0]
            let sty = this.letters[i][1]
    
            this.images.push(getTextImage(ch, sty))
        }

        // console.log(this.images)
    }

    drawAt(x, y) {
        let totalWidth = 0, maxAbove = 0, maxBelow = 0
        this.images.forEach((img) => {
            totalWidth += img.imageData.width
            maxAbove = Math.max(maxAbove, img.heightAbove)
            maxBelow = Math.max(maxBelow, img.heightBelow)
        })
    
        let messageHeight = maxAbove + maxBelow
        let baseY = (y - messageHeight / 2) + maxAbove
        let currX = x - totalWidth / 2
    
        for (let i = 0; i < this.images.length; i++) {
            let img = this.images[i]
    
            ctx.putImageData(img.imageData, currX, baseY - img.heightAbove)
    
            currX += img.imageData.width
        }
    }
}

let displayMessage = new DisplayMessage()

function setText(txt) {

    letterData = []

    for (let i = 0; i < txt.length; i++) {
        let ch = txt.charAt(i)

        letterData.push([ch, new TextStyle(Math.floor(30 + 16 * Math.random()), "serif")])
        // (getTextImage(ch))
    }
}

function drawText() {
    letterImages = []

    for (let i = 0; i < letterData.length; i++) {
        let ch = letterData[i][0]
        let sty = letterData[i][1]

    
        letterImages.push(getTextImage(ch, sty))
    }

    let totalWidth = 0
    letterImages.forEach((img) => {
        totalWidth += img.imageData.width
    })

    let x = (canvas.width - totalWidth) / 2

    for (let i = 0; i < letterImages.length; i++) {
        let img = letterImages[i]

        ctx.putImageData(img.imageData, x, (canvas.height - img.imageData.height) / 2)

        x += img.imageData.width
    }
}

let drawX = canvas.width / 2, drawY = canvas.height / 2
let targetX = drawX, targetY = drawY
let vel = 50

function updateLoc(delta) {
    let angle = Math.atan2(targetY - drawY, targetX - drawX)
    let currVel = vel + interpolateIntensity(0, 650)
    let dX = Math.cos(angle) * currVel * delta
    let dY = Math.sin(angle) * currVel * delta
    // let dX = (vX + (intensity - 0.5)) * delta
    // let dY = (vY + (intensity - 0.5)) * delta
    if (Math.abs(targetX - drawX) < dX) {
        drawX = targetX
    } else {
        drawX += dX
    }
    if (Math.abs(targetY - drawY) < dY) {
        drawY = targetY
    } else {
        drawY += dY
    }
}

function updateIntensity(delta) {
    // if (intensity > 8) intensity -= delta
    // else if (intensity > 6) intensity -= 0.8 * delta
    // else if (intensity > 4) intensity -= 0.6 * delta
    // else if (intensity > 2) intensity -= 0.4 * delta
    // else  intensity -= 0.2 * delta

    intensity -= interpolateIntensity(0.2, 1) * delta

    if (intensity < 0.5) intensity = 0.5
}

function updateTick() {
    displayMessage.setText("Happy Birthday, Dad!")

    vRed = (Math.random() * 2 - 1) // * interpolateIntensity(0.5, 3)
    vGreen = (Math.random() * 2 - 1) // * interpolateIntensity(0.5, 3)
    vBlue = (Math.random() * 2 - 1) // * interpolateIntensity(0.5, 3)

    console.log("Tick!")
}

function updateFrame(timestamp) {
    if (prev === undefined) prev = timestamp
    if (startTick === undefined) {
        updateTick()
        startTick = timestamp
    }

    let dTick = (timestamp - startTick) / 1000

    if (dTick > tickLength) {
        updateTick()
        startTick = timestamp
    }

    if (prev !== timestamp) {
        let delta = (timestamp - prev) / 1000
        
        tickLength = interpolateIntensity(2, 0.2)

        updateIntensity(delta)
        updateLoc(delta)
        updateColors(delta)
    }

    // textImage = getTextImage("Happy Birthday, Dad! " + roundTo(dTick, 2) + "/" + roundTo(tickLength, 2))


    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = getColor()
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    displayMessage.getImages()
    displayMessage.drawAt(drawX, drawY)
    // drawText()
    // ctx.putImageData(textImage, 100, 100)
    // console.log(timestamp)
    prev = timestamp
    requestAnimationFrame(updateFrame)
}

addEventListener("click", (event) => {
    targetX = event.clientX
    targetY = event.clientY

    intensity += 1
    if (intensity > 10) intensity = 10
})

requestAnimationFrame(updateFrame)