// Load Node Packages
express = require('express');
crypto = require('crypto');
body_parser = require('body-parser');
request = require('request');
app = express();
port = process.env.PORT || 5000

// Setup Config

FB_ACCESS_TOKEN = 'Paste here...',
FB_VERIFY_TOKEN = '123456',
FB_APP_SECRET = 'Paste here...',


// Handle JSON
app.use(body_parser.json());

// Check Facebook Signature
app.use(body_parser.json({
    verify: check_fb_signature
}));

function check_fb_signature(req, res, buf) {
    console.log('Check facebook signature step.')
    var fb_signature = req.headers["x-hub-signature"];
    if (!fb_signature) {
        throw new Error('Signature ver failed.');
    } else {
        var sign_splits = signature.split('=');
        var method = sign_splits[0];
        var sign_hash = sign_splits[1];

        var real_hash = crypto.createHmac('sha1', FB_APP_SECRET)
            .update(buf)
            .digest('hex');

        if (sign_hash != real_hash) {
            throw new Error('Signature ver failed.');
        }
    }
}


// Verify Webhook URL
app.get('/webhook/', function (req, res) {
    console.log('Webhook verification step.')
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Authentication Failed!.");
        res.sendStatus(403);
    }
})

// Listen Requests
app.listen(port, function () {
    console.log('webhook is running on port', port)
})

// Handle Post Request to receive messages.
app.post('/webhook/', function (req, res) {
    console.log('Webhook messaging step.')
    var chat_data = req.body;
    // Make sure this is a page subscription
    if (chat_data.object == 'page') {
        // Iterate over each entry
        chat_data.entry.forEach(function (page_body) {
            // Iterate over each message
            page_body.messaging.forEach(function (message_obj) {
                console.log(message_obj)
                if (message_obj.message) {
                    getMessage(message_obj);
                    sendMessage(message_obj.sender.id,"Greeting from Aitude!")
                }
            });
        });

        // Indicate all went well.
        res.sendStatus(200);
    }
});

// Get Message
function getMessage(message_obj) {
    var message = message_obj.message.text;
    console.log(message)
}

// Send Message
function sendMessage(recipient_id, message) {
    var messageData = {
        recipient: {
            id: recipient_id
        },
        message: {
            text: message
        }
    }
    request({
        uri: 'https://graph.facebook.com/v3.2/me/messages',
        qs: {
            access_token: FB_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Messeage sent successsfully.");
        } else {
            console.log("Message failed - " + response.statusMessage);
        }
    });
}
