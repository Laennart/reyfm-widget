// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: bolt;

let channel = 'original'
let param = args.widgetParameter
if (param != null && param.length > 0)
    channel = param

const apiUrl = 'https://api.reyfm.de/v4'
const logoUrl = 'https://cdn.reyfm.de/img/logo.png'
const listenerIconUrl = 'https://cdn.imarustudios.de/reyfm/icons/listener_icon.png'

const widget = new ListWidget()
const channelInfo = await fetchChannelInfo();
await createWidget()

// used for debugging if script runs inside the app
if (config.runsInApp)
    await (getSize() === 0 ? widget.presentSmall() : (getSize() === 1 ? widget.presentMedium() : widget.presentLarge()))
Script.setWidget(widget)
Script.complete()

function getSize() {
    if (config.runsInApp)
        return 2;
    switch (config.widgetFamily) {
        case 'small': return 0;
        case 'medium': return 1;
        case 'large': return 2;
        default: return 0;
    }
}

async function createWidget() {
    if (getSize() === 0)
        widget.setPadding(10, 10, 10, 10)
    else
        widget.setPadding(17, 17, 17, 17)
    widget.backgroundColor = Color.dynamic(new Color('#ffffff'), new Color('#131317'));

    // Add logo
    const logoStack = widget.addStack()
    logoStack.layoutHorizontally()
    const logoImageStack = logoStack.addStack()
    const logoImg = await getLogo()
    const img = logoImageStack.addImage(logoImg);
    img.imageSize = new Size(getLogoSize(), getLogoSize())
    img.leftAlignImage()
    img.tintColor = Color.dynamic(new Color('#000000'), new Color('#ffffff'))
    logoStack.addSpacer(getSize() === 0 ? 4 : 10)

    // add channel name
    const textStack = logoStack.addStack()
    textStack.layoutVertically()
    textStack.addSpacer(getChannelNameSpacer())
    const text = textStack.addText('#' + channel.toUpperCase())
    text.leftAlignText()
    text.font = Font.boldSystemFont(getChannelNameFontSize())

    widget.addSpacer()
    if (typeof channelInfo == "undefined") {
        // channel does not exist
        text.textColor = Color.dynamic(new Color('#2e3135'), new Color('#ffffff'))
        //TODO
    } else {
        widget.url = 'https://reyfm.de/' + channel

        // add listener icon and amount
        if (getSize() !== 0) {
            logoStack.addSpacer()
            const listenerStack = logoStack.addStack()
            listenerStack.layoutVertically()
            listenerStack.addSpacer(getChannelNameSpacer())
            const contentStack = listenerStack.addStack()

            const iconStack = contentStack.addStack()
            iconStack.layoutVertically()
            iconStack.addSpacer(3)

            const listenerImg = await getListenerIcon()
            const listenerIcon = iconStack.addImage(listenerImg)
            listenerIcon.imageSize = new Size(17, 17)
            listenerIcon.tintColor = Color.dynamic(new Color('#242728'), new Color('#b3b5ad'))

            const listener = contentStack.addText(' ' + channelInfo.listeners.toString())
            listener.leftAlignText()
            listener.font = Font.boldSystemFont(getChannelNameFontSize())
            listener.textColor = Color.dynamic(new Color('#242728'), new Color('#b3b5ad'))
        }

        text.textColor = new Color(channelInfo.color);
        let artist = channelInfo.now.artist
        let title = channelInfo.now.title
        let coverUrl = channelInfo.now.cover_urls['240x240'];
        await addTrack(title, artist, coverUrl)

        if (getSize() === 2) {
            let count = 0;
            for (let key in channelInfo.history) {
                if (count === 2)
                    continue
                widget.addSpacer(15)
                if (channelInfo.history.hasOwnProperty(key)) {
                    let trackObj = channelInfo.history[key]
                    let time = trackObj.played_at
                    let artist = trackObj.artist
                    let title = trackObj.title
                    let coverUrl = trackObj.cover_urls['240x240']
                    await addTrack(title, artist, coverUrl, time)
                    count++;
                }
            }
        }
    }
    widget.addSpacer()
}

async function addTrack(title, artist, coverUrl, time) {
    // trim artist name
    if (artist.length > getArtistLength()) {
        artist = artist.substr(0, getArtistLength())
        while (artist.endsWith(" "))
            artist = artist.substr(0, artist.length - 1)
        artist += '...'
    }

    // trim title
    if (title.length > getTitleLength()) {
        title = title.substr(0, getTitleLength())
        while (title.endsWith(" "))
            title = title.substr(0, title.length - 1)
        title += '...'
    }

    const trackStack = widget.addStack()
    if (getSize() === 0)
        trackStack.layoutVertically()
    else {
        trackStack.layoutHorizontally()
        if (getSize() === 1)
            trackStack.backgroundColor = Color.dynamic(new Color(channelInfo.color),  new Color('#242728'))
        else {
            if (time === undefined) {
                trackStack.backgroundColor = new Color(channelInfo.color)
            } else {
                trackStack.backgroundColor = Color.dynamic(new Color('#b3b5ad'), new Color('#242728'))
            }
        }
        trackStack.cornerRadius = 9
    }

    const coverStack = trackStack.addStack()
    const coverImg = await new Request(coverUrl).loadImage()
    const cover = coverStack.addImage(coverImg)
    cover.imageSize = new Size(getCoverSize(), getCoverSize())
    cover.leftAlignImage()
    cover.cornerRadius = 8
    trackStack.addSpacer(getSize() === 0 ? 5 : 10)
    const trackTextStack = trackStack.addStack();
    trackTextStack.layoutVertically()
    trackTextStack.addSpacer(getSize() === 0 ? 2 : 10)

    if (getSize() === 2) {
        const timeText = trackTextStack.addText(typeof time === "undefined" ? "LIVE" : time);
        timeText.textColor = typeof time === "undefined" ? new Color('#ffffff') : Color.dynamic(new Color('#ffffff'), new Color('#b3b5ad'));
        timeText.font = Font.lightSystemFont(getTitleFontSize() - 3)
    }

    const artistText = trackTextStack.addText(artist);
    const titleText = trackTextStack.addText(title);

    if (getSize() === 0)
        titleText.textColor = Color.dynamic(new Color('#242728'), new Color('#b3b5ad'))
    else
        titleText.textColor =  typeof time === "undefined" ? new Color('#ffffff') : Color.dynamic(new Color('#ffffff'), new Color('#b3b5ad'))
    titleText.font = Font.lightSystemFont(getTitleFontSize())

    if (getSize() === 0)
        artistText.textColor = Color.dynamic(new Color('#242728'), new Color('#b3b5ad'))
    else
        artistText.textColor = typeof time === "undefined" ? new Color('#ffffff') : Color.dynamic(new Color('#ffffff'), new Color('#b3b5ad'))
    artistText.font = Font.boldSystemFont(getSize() === 0 ? 14 : 16)

    trackStack.addSpacer()
}

async function fetchChannelInfo() {
    let req = new Request(apiUrl)
    let apiResult = await req.loadJSON()
    if (req.response.statusCode === 200) {
        for (let key in apiResult.channels) {
            if (apiResult.channels.hasOwnProperty(key)) {
                let channelObj = apiResult.channels[key];
                if (channelObj.name === channel || channelObj.id === channel)
                    return channelObj;
            }
        }
    }
}

async function getListenerIcon() {
    return await getImage('listener-icon.png', listenerIconUrl)
}

async function getLogo() {
    return await getImage('logo.png', logoUrl)
}

async function getImage(name, url) {
    let fm = FileManager.local()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, name)
    if (fm.fileExists(path)) {
        return fm.readImage(path)
    } else {
        let image = await new Request(url).loadImage()
        fm.writeImage(path, image)
        return image
    }
}

function getChannelNameSpacer() {
    switch (getSize()) {
        case 0: return 7;
        case 1: return 8;
        case 2: return 8;
    }
}

function getLogoSize() {
    switch (getSize()) {
        case 0: return 34;
        case 1: return 40;
        case 2: return 41;
    }
}

function getTitleFontSize() {
    switch (getSize()) {
        case 0: return 13;
        case 1: return 15;
        case 2: return 15;
    }
}

function getChannelNameFontSize() {
    switch (getSize()) {
        case 0: return 16;
        case 1: return 20;
        case 2: return 20;
    }
}

function getCoverSize() {
    switch (getSize()) {
        case 0: return 50;
        case 1: return 60;
        case 2: return 70;
    }
}

function getTitleLength() {
    switch (getSize()) {
        case 0: return 22;
        case 1: return 27;
        case 2: return 22;
    }
}

function getArtistLength() {
    switch (getSize()) {
        case 0: return 15;
        case 1: return 24;
        case 2: return 20;
    }
}
