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

class PhysicsData {
    constructor() {
        this.x = undefined
        this.y = undefined

        this.vx = 0
        this.vy = 0
        this.ax = 0
        this.ay = 0
    }

    setLoc(x, y) {
        this.x = x
        this.y = y
    }

    moveTowards(targetX, targetY, delta) {
        let angle = Math.atan2(targetY - this.y, targetX - this.x)
        let currVel = vel + interpolateIntensity(0, 650)
        let dX = Math.cos(angle) * currVel * delta
        let dY = Math.sin(angle) * currVel * delta
        // let dX = (vX + (intensity - 0.5)) * delta
        // let dY = (vY + (intensity - 0.5)) * delta
        if (Math.abs(targetX - this.x) < dX) {
            this.x = targetX
        } else {
            this.x += dX
        }
        if (Math.abs(targetY - this.y) < dY) {
            this.y = targetY
        } else {
            this.y += dY
        }
    }

    resetAcc() {
        this.ax = 0
        this.ay = 0
    }

    springTowards(targetX, targetY, k) {
        let dist = Math.hypot(targetY - this.y, targetX - this.x)
        let angle = Math.atan2(targetY - this.y, targetX - this.x)

        this.ax += Math.cos(angle) * k * dist
        this.ay += Math.sin(angle) * k * dist
    }

    drag(d) {
        let v = Math.hypot(this.vy, this.vx, 3)
        let angle = Math.atan2(this.vy, this.vx)

        this.ax -= Math.cos(angle) * d * v * v
        this.ay -= Math.sin(angle) * d * v * v
    }

    updateVel(delta) {
        this.vx += this.ax * delta
        this.vy += this.ay * delta
    }

    updateLoc(delta) {
        this.x += this.vx * delta
        this.y += this.vy * delta
    }
}

class CharacterSprite {
    constructor(txt, style) {
        this.txt = txt
        this.style = style
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext("2d")
        this.textData = undefined
        this.textWidth = undefined
        this.textHeight = undefined

        this.physics = new PhysicsData()
    }

    generate() {
        if (this.textData !== undefined) {
            this.ctx.clearRect(0, 0, this.textWidth, this.textHeight)
        }
    
        this.ctx.font = this.style.toString()
    
        if (this.txt !== " ") this.textData = this.ctx.measureText(this.txt)
        else this.textData = this.ctx.measureText("?")
    
        this.textWidth = this.textData.actualBoundingBoxLeft + this.textData.actualBoundingBoxRight
        this.textHeight = this.textData.actualBoundingBoxAscent + this.textData.actualBoundingBoxDescent

        // this.ctx.fillStyle = getColor()
        // this.ctx.fillRect(0, 0, textWidth, textHeight)
        this.ctx.strokeStyle = getInvColor()
        this.ctx.fillStyle = getInvColor()
        if (this.style.stroke) this.ctx.strokeText(this.txt, this.textData.actualBoundingBoxLeft, this.textData.actualBoundingBoxAscent)
        else this.ctx.fillText(this.txt, this.textData.actualBoundingBoxLeft, this.textData.actualBoundingBoxAscent)
    }

    draw() {
        let renderX = this.physics.x - this.textWidth / 2
        let renderY = this.physics.y - this.textData.actualBoundingBoxAscent
    
        ctx.drawImage(this.canvas,
                      0, 0, this.textWidth, this.textHeight,
                      renderX, renderY, this.textWidth, this.textHeight)
        // Wow, that's it
    }
}
class DisplayMessage {
    constructor() {
        this.message = undefined
        this.sprites = undefined

        this.targetX = undefined
        this.targetY = undefined
        // this.currLoc = new PhysicsData()
    }

    setText(txt) {
        if (txt !== this.message) {
            this.message = txt
            this.sprites = []

            for (let i = 0; i < this.message.length; i++) {
                let ch = this.message.charAt(i)

                let sprite = new CharacterSprite(ch, new TextStyle())
        
                this.sprites.push(sprite)
            }
        }
    }

    refreshText() {
        for (let i = 0; i < this.sprites.length; i++) {
            if ((Math.random() <= interpolateIntensity(0.1, 1))) this.sprites[i].style.randomize()
        }
    }

    getImages() {
        for (let i = 0; i < this.sprites.length; i++) {
            this.sprites[i].generate()
        }
    }

    setLoc(x, y) {
        let totalWidth = 0, maxAbove = 0, maxBelow = 0
        this.sprites.forEach((sprite) => {
            totalWidth += sprite.textWidth
            maxAbove = Math.max(maxAbove, sprite.textData.actualBoundingBoxAscent)
            maxBelow = Math.max(maxBelow, sprite.textData.actualBoundingBoxDescent)
        })
    
        let messageHeight = maxAbove + maxBelow
        let baseY = (y - messageHeight / 2) + maxAbove
        let currX = x - totalWidth / 2
    
        for (let i = 0; i < this.sprites.length; i++) {
            let sprite = this.sprites[i]
    
            sprite.physics.setLoc(currX + sprite.textWidth / 2, baseY)
    
            currX += sprite.textWidth
        }

        let head = this.sprites[0]

        this.targetX = head.physics.x
        this.targetY = head.physics.y

        // this.currLoc.setLoc(x, y)

        // this.updateOffsets()
    }

    setTarget(x, y) {
        this.targetX = x
        this.targetY = y
    }

    draw() {
        for (let i = 0; i < this.sprites.length; i++) {
            this.sprites[i].draw()
        }
    }

    update(delta) {
        
        let head = this.sprites[0]
        let sentinel = this.sprites[1]
        console.log(`Update start: ${delta}`)
        console.log(`\t(${sentinel.physics.x}, ${sentinel.physics.y}) (${sentinel.physics.vx}, ${sentinel.physics.vy}) (${sentinel.physics.ax}, ${sentinel.physics.ay})`)

        
        for (let i = 1; i < this.sprites.length; i++) {
            this.sprites[i].physics.resetAcc()
            let prevSprite = this.sprites[i - 1]
            let currSprite = this.sprites[i]
            let targetX = prevSprite.physics.x + (prevSprite.textWidth + currSprite.textWidth) / 2
            let targetY = prevSprite.physics.y
            currSprite.physics.springTowards(targetX, targetY, 10)
            currSprite.physics.drag(0.01 + 0.001 * Math.pow(i - 1, 1.25))
        }
        console.log(`\t(${sentinel.physics.x}, ${sentinel.physics.y}) (${sentinel.physics.vx}, ${sentinel.physics.vy}) (${sentinel.physics.ax}, ${sentinel.physics.ay})`)
        
        for (let i = 1; i < this.sprites.length - 1; i++) {
            let nextSprite = this.sprites[i + 1]
            let currSprite = this.sprites[i]
            let targetX = nextSprite.physics.x - (nextSprite.textWidth + currSprite.textWidth) / 2
            let targetY = nextSprite.physics.y
            currSprite.physics.springTowards(targetX, targetY, 2)
        }
        console.log(`\t(${sentinel.physics.x}, ${sentinel.physics.y}) (${sentinel.physics.vx}, ${sentinel.physics.vy}) (${sentinel.physics.ax}, ${sentinel.physics.ay})`)
        
        for (let i = 1; i < this.sprites.length; i++) {
            this.sprites[i].physics.updateVel(delta)
        }
        console.log(`\t(${sentinel.physics.x}, ${sentinel.physics.y}) (${sentinel.physics.vx}, ${sentinel.physics.vy}) (${sentinel.physics.ax}, ${sentinel.physics.ay})`)

        head.physics.moveTowards(this.targetX, this.targetY, delta)
        console.log(`\t(${sentinel.physics.x}, ${sentinel.physics.y}) (${sentinel.physics.vx}, ${sentinel.physics.vy}) (${sentinel.physics.ax}, ${sentinel.physics.ay})`)
        
        for (let i = 1; i < this.sprites.length; i++) {
            this.sprites[i].physics.updateLoc(delta)
        }

        console.log(`\t(${sentinel.physics.x}, ${sentinel.physics.y}) (${sentinel.physics.vx}, ${sentinel.physics.vy}) (${sentinel.physics.ax}, ${sentinel.physics.ay})`)
    }
}

let displayMessage = new DisplayMessage()
displayMessage.setText("Happy Fathers' Day, Dad!")
displayMessage.getImages()
displayMessage.setLoc(canvas.width / 2, canvas.height / 2)

let vel = 50

function updateIntensity(delta) {
    // if (intensity > 8) intensity -= delta
    // else if (intensity > 6) intensity -= 0.8 * delta
    // else if (intensity > 4) intensity -= 0.6 * delta
    // else if (intensity > 2) intensity -= 0.4 * delta
    // else  intensity -= 0.2 * delta

    intensity -= interpolateIntensity(0.2, 1) * delta

    if (intensity < 0.5) intensity = 0.5
}

function updateTick(isStart) {
    if (!isStart) displayMessage.refreshText()

    vRed = (Math.random() * 2 - 1) // * interpolateIntensity(0.5, 3)
    vGreen = (Math.random() * 2 - 1) // * interpolateIntensity(0.5, 3)
    vBlue = (Math.random() * 2 - 1) // * interpolateIntensity(0.5, 3)

    console.log("Tick!")

    str = ""

}

function updateFrame(timestamp) {

    if (prev === undefined) prev = timestamp
    if (startTick === undefined) {
        updateTick(true)
        startTick = timestamp
    }

    let dTick = (timestamp - startTick) / 1000

    if (dTick > tickLength) {
        updateTick(false)
        startTick = timestamp
    }

    if (prev !== timestamp) {
        let delta = (timestamp - prev) / 1000
        // console.log(delta)
        
        tickLength = interpolateIntensity(2, 0.2)

        updateIntensity(delta)
        
        updateColors(delta)

        displayMessage.update(delta)

        // updateLoc(delta)
    }

    // textImage = getTextImage("Happy Birthday, Dad! " + roundTo(dTick, 2) + "/" + roundTo(tickLength, 2))


    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = getColor()
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    displayMessage.getImages()
    // displayMessage.setLoc(drawX, drawY)
    displayMessage.draw()
    // drawText()
    // ctx.putImageData(textImage, 100, 100)
    // console.log(timestamp)
    prev = timestamp
    if (!isNaN(displayMessage.sprites[1].physics.x)) requestAnimationFrame(updateFrame)
}

addEventListener("click", (event) => {
    displayMessage.targetX = event.clientX
    displayMessage.targetY = event.clientY

    intensity += 1
    if (intensity > 10) intensity = 10
})

requestAnimationFrame(updateFrame)