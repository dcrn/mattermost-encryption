// ==UserScript==
// @name         Mattermost Encryption
// @namespace    https://github.com/dcrn
// @version      1.2
// @description  Add encryption to mattermost
// @author       dcrn
// @match        http://localhost:8065/*
// @updateURL    https://github.com/dcrn/mattermost-encryption/raw/master/mattermost_encryption.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @require      https://raw.githubusercontent.com/travist/jsencrypt/master/bin/jsencrypt.min.js
// ==/UserScript==


function EncryptionHandler() {
    this.encryption = new JSEncrypt();
    this.decryption = new JSEncrypt();
}
EncryptionHandler.prototype.setDecryptionKey = function(key) {
    this.decryption.setPrivateKey(key);
};
EncryptionHandler.prototype.setEncryptionKey = function(key) {
    this.encryption.setPublicKey(key);
};
EncryptionHandler.prototype.encrypt = function(msg) {
    return this.encryption.encrypt(msg);
};
EncryptionHandler.prototype.decrypt = function(msg) {
    return this.decryption.decrypt(msg);
};


function MessageHandler() {
    this.channel = null;
    this.selfData = null;
    this.lastSentMessage = null;
    this.encryptionHandler = new EncryptionHandler();
}
MessageHandler.prototype.updateSettings = function(settings) {
	this.enabled = settings.enabled !== null ? settings.enabled : false;
	this.privateKey = settings.privateKey;
	this.publicKey = settings.publicKey;
	this.encryptionHandler.setDecryptionKey(this.privateKey);
	this.encryptionHandler.setEncryptionKey(this.publicKey);
};
MessageHandler.prototype.processInputMessage = function(msg) {
    if (!this.enabled || this.publicKey === null)
        return null;

    var encryptedMsg = this.encryptionHandler.encrypt(msg);
    if (encryptedMsg === false) {
    	window.console.log("Unable to encrypt message; invalid key");
    	return null;
    }

    this.lastSentMessage = msg;
    return "AA//" + encryptedMsg;
};
MessageHandler.prototype.processOwnMessage = function(msg) {
    if (this.isEncryptedMessage(msg)) {
        if (this.lastSentMessage !== null) {
            msg = this.lastSentMessage;
            this.lastSentMessage = null;
            return msg;
        }
        return "(unknown)";
    }
    return null;
};
MessageHandler.prototype.processReceivedMessage = function(msg) {
    if (this.isEncryptedMessage(msg)) {
        if (this.privateKey) {
            var decryptedMsg = this.encryptionHandler.decrypt(msg.substr(4));
            if (decryptedMsg === false)
            	return "(unknown - invalid key)";
            if (decryptedMsg === null)
            	return "(unknown - wrong key)";
            
            return decryptedMsg;
        }
        return "(unknown)";
    }
    return null;
};
MessageHandler.prototype.isEncryptedMessage = function(msg) {
    try {
        atob(msg);
        return msg.substr(0, 4) === "AA//";
    }
    catch(ex) {
        return false;
    }
};


function ChannelEncryptionService() {
	this.channelName = null;
	this.settings = {privateKey: null, publicKey: null, enabled: false};
	this.messageHandler = new MessageHandler();
}
ChannelEncryptionService.prototype.changeChannel = function(channelName) {
	if (this.channelName === channelName)
		return;

	this.channelName = channelName;
	this.loadChannelSettings();
	this.messageHandler.updateSettings(this.settings);
};
ChannelEncryptionService.prototype.loadChannelSettings = function() {
	if (this.channelName === null) {
		this.settings = {};
		return;
	}

	this.settings.enabled = GM_getValue(this.channelName + "/enabled", null);
	this.settings.publicKey = GM_getValue(this.channelName + "/publicKey", null);
	this.settings.privateKey = GM_getValue(this.channelName + "/privateKey", null);
};
ChannelEncryptionService.prototype.getMessageHandler = function() {
	return this.messageHandler;
};
ChannelEncryptionService.prototype.getEnabled = function() {
	return this.settings.enabled;
};
ChannelEncryptionService.prototype.setEnabled = function(enabled) {
	if (this.channelName === null)
		return;

	if (enabled === true)
		this.settings.enabled = enabled;
	else
		this.settings.enabled = false;

	GM_setValue(this.channelName + "/enabled", this.settings.enabled);
	this.messageHandler.updateSettings(this.settings);
};
ChannelEncryptionService.prototype.getPublicKey = function() {
	return this.settings.publicKey;
};
ChannelEncryptionService.prototype.setPublicKey = function(publicKey) {
	if (this.channelName === null)
		return;

	this.settings.publicKey = publicKey;
	if (publicKey !== null && publicKey.length === 0)
		this.settings.publicKey = null;

	GM_setValue(this.channelName + "/publicKey", this.settings.publicKey);
	this.messageHandler.updateSettings(this.settings);
};
ChannelEncryptionService.prototype.getPrivateKey = function() {
	return this.settings.privateKey;
};
ChannelEncryptionService.prototype.setPrivateKey = function(privateKey) {
	if (this.channelName === null)
		return;

	this.settings.privateKey = privateKey;
	if (privateKey !== null && privateKey.length === 0)
		this.settings.privateKey = null;

	GM_setValue(this.channelName + "/privateKey", this.settings.privateKey);
	this.messageHandler.updateSettings(this.settings);
};


var encryptionService = new ChannelEncryptionService();
var lastPlaintextMessage = null;

function onMessageSend(inputElement) {
	lastPlaintextMessage = inputElement.value;

	var newMsg = encryptionService
		.getMessageHandler()
		.processInputMessage(inputElement.value);

	if (newMsg !== null) {
		inputElement.value = newMsg;
		inputElement.dispatchEvent(new Event(
			"input", 
			{bubbles: true, target: inputElement, data:newMsg}
		));
	}
}

function onMessageReceive(messageElement) {
	messageElement.classList.add("mme-processed");
	var textElement = getTextElement(messageElement);
	if (textElement === null)
		return;

	var msg = textElement.nodeValue;
	var newMsg = null;
	if (messageElement.id.indexOf("_undefined") >= 0) {
		textElement.nodeValue = lastPlaintextMessage;
		lastPlaintextMessage = null;
		return;
	} else if (messageElement.classList.contains("current--user")) {
		newMsg = encryptionService.getMessageHandler().processOwnMessage(msg);
	} else {
		newMsg = encryptionService.getMessageHandler().processReceivedMessage(msg);
	}

	if (newMsg !== null) {
		messageElement.classList.add("secure");
		textElement.nodeValue = newMsg;
	}
}

function onChannelChanged(channelName) {
	encryptionService.changeChannel(channelName);
	var toggleButton = document.getElementById("mme-toggle-button");
	var settingsContainer = document.getElementById("mme-settings-container");

	if (toggleButton !== null)
		toggleButton.classList.toggle("mme-enabled", encryptionService.getEnabled());
	if (settingsContainer !== null)
		settingsContainer.classList.toggle("hidden", true);
}

function getTextElement(messageElement) {
    var textElement = messageElement.querySelector(".post-message__text p");

    if (textElement === null || textElement.childNodes.length != 1 || textElement.childNodes[0].nodeName !== "#text")
        return null;

    return textElement.childNodes[0];
}


function attachInputEvent(element) {
	element.addEventListener("keydown", function(keyEvent) {
		if (keyEvent.keycode === 13 || keyEvent.which === 13) {
			onMessageSend(keyEvent.target);
		}
	});

	return true;
}

function attachToggleButton(element) {
	var button = document.createElement("SPAN");
	button.id = "mme-toggle-button";
	button.classList.add("fa");
	button.classList.add("fa-user-secret");
	button.classList.add("icon--emoji-picker");

	button.classList.toggle("mme-enabled", encryptionService.getEnabled());

    button.addEventListener("click", function(event) {
    	encryptionService.setEnabled(!encryptionService.getEnabled());
    	button.classList.toggle("mme-enabled", encryptionService.getEnabled());
	});

    element.appendChild(button);
}

function attachSettingsButton(element) {
	var button = document.createElement("SPAN");
	button.classList.add("fa");
	button.classList.add("fa-puzzle-piece");
	button.classList.add("icon--emoji-picker");

    var settingsModal = buildSettingsModal();
    settingsModal.container.classList.add("hidden");
    document.body.appendChild(settingsModal.container);

    button.addEventListener("click", function(event) {
    	if (settingsModal.container.classList.toggle("hidden") === false) {
	    	var privKey = encryptionService.getPrivateKey();
	    	if (privKey === null)
	    		privKey = "";
	    	var pubKey = encryptionService.getPublicKey();
	    	if (pubKey === null)
	    		pubKey = "";

	    	settingsModal.privKeyInput.value = privKey;
	    	settingsModal.pubKeyInput.value = pubKey;
	    }
    });

    element.appendChild(button);
}

function buildSettingsModal() {
	var container = document.createElement("DIV");
	var pubKeyInput = document.createElement("TEXTAREA");
	var privKeyInput = document.createElement("TEXTAREA");
	var pubKeyUpdate = document.createElement("BUTTON");
	var privKeyUpdate = document.createElement("BUTTON");

	container.id = "mme-settings-container";

	privKeyUpdate.addEventListener("click", function(event) {
		event.preventDefault();
		var newKey = privKeyInput.value;
		if (newKey === null || newKey === "")
			newKey = null;

		encryptionService.setPrivateKey(newKey);
	});

	pubKeyUpdate.addEventListener("click", function(event) {
		event.preventDefault();
		var newKey = pubKeyInput.value;
		if (newKey === null || newKey === "")
			newKey = null;

		encryptionService.setPublicKey(newKey);
	});

	pubKeyUpdate.appendChild(document.createTextNode("Set Public Key"));
	privKeyUpdate.appendChild(document.createTextNode("Set Private Key"));

	
	var pubHeader = document.createElement("SPAN");
	pubHeader.appendChild(document.createTextNode("Channel public key"));
	var privHeader = document.createElement("SPAN");
	privHeader.appendChild(document.createTextNode("Channel private key"));

	container.appendChild(pubHeader);
	container.appendChild(pubKeyInput);
	container.appendChild(pubKeyUpdate);

	container.appendChild(privHeader);
	container.appendChild(privKeyInput);
	container.appendChild(privKeyUpdate);
	container.appendChild(document.createElement("BR"));
	container.appendChild(document.createElement("BR"));

	return {container: container, privKeyInput: privKeyInput, pubKeyInput: pubKeyInput};
}


(function () {
    var attachments = {
        "#post_textbox": attachInputEvent,
        ".post-body__cell .btn": function(ele) {
        	attachSettingsButton(ele);
        	attachToggleButton(ele);
        }
    };

    var lastPath = window.location.pathname;
    onChannelChanged(lastPath);

    var domChangedObserver = new MutationObserver(function(mutations) {
		if (window.location.pathname != lastPath) {
			lastPath = window.location.pathname;
			onChannelChanged(lastPath);
		}

        for (var query in attachments) {
        	var ele = document.querySelector(query);

            if (ele !== null) {
                attachments[query](ele);
                delete attachments[query];
            }
        }

        var newMessages = document.querySelectorAll("div.post:not(.mme-processed)");
        if (newMessages.length !== 0) {
            newMessages.forEach(onMessageReceive);
        }
    });
    domChangedObserver.observe(document.documentElement, {childList: true, subtree: true});

    GM_addStyle(`
    .post.secure .post__body::after {
    	content: "\\f21b" !important;
    	visibility: visible !important;
    	height: auto !important;
		font-family: FontAwesome;
		color: #AFAFAF;
		position: absolute;
		right: 12px;
    }

    .post.secure.other--root .post__body::after {
		top: 26px;
    }

    .post.secure.same--root .post__body::after {
		top: 6px;
    }

	#mme-settings-container {
    	position: fixed;
    	bottom: 70px;
    	right: 14px;
    	width: 278px;
    	height: 362px;

    	overflow-y: scroll;
    	text-align: center;

    	border-radius: 6px;
    	background-color: #F5F5F5;
    	border: solid 1px #D8D8D8;
    	z-index: 8;
    }

    #mme-settings-container span {
    	display: block;
    	padding: 4px;
    	width: 100%;
    	background-color: #FEFEFE;
    	border-top: solid 1px #D8D8D8;
    	border-bottom: solid 1px #D8D8D8;
    	margin-top: 4px;
    	margin-bottom: 4px;
    }

    #mme-settings-container span:first-child {
    	margin-top: 0px;
    	border-top: none;
    }

    #mme-settings-container textarea {
    	width: 90%;
    	height: 140px;
    	border: 1px solid #D8D8D8;
    	border-radius: 2px;
    	background-color: white;
    	resize: none;
    }

    #mme-settings-container button {
    	width: 90%;
    	height: 30px;
    	background-color: #FAFAFA;
    	border: 1px solid #D8D8D8;
    	border-radius: 2px;
    	margin: 2px;
    }

    .mme-enabled {
    	color: #006600;
    }
    `);
})();
