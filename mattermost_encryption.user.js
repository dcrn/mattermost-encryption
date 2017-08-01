// ==UserScript==
// @name         Mattermost Encryption
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://localhost:8065/*
// @grant        none
// @require      https://raw.githubusercontent.com/travist/jsencrypt/master/bin/jsencrypt.min.js
// ==/UserScript==

var myRsa = new JSEncrypt();
myRsa.setPrivateKey(`-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA8KFclmpU+2oFHKfgoYM4Drw87qZIacNfaz/BieZ0aVSYlBym
VodBrJeYzao+UpxuKrzMWBBZg3QhRCnbaNAKmmNfSheG02guY8ojOjoe/P/RTX0q
a8E57O0d52asqQY4A2d4cCEZzEmDnZIC1NSPaXdgWzgphgzgrs2dLqj4UhM+BnpK
WKKRUyJMsTY0aV36Xscy1htqQw26aDeKUrikOQeQKbIba952ZIZ7LEb1cYnplIfW
gIio5kDfj1HESIASkmKTSWAUTf7C79jtbu3vLAZI4fA8QdW7kQb1XNv3WXM73LIt
DimMnJZgTAP+PW7ZLT5DHWRyYGNX/5t3KWw3wwIDAQABAoIBAQCzQiItU61XVhXU
0SNAbvZ107k4t9s+HvOYe/h7+JhEV2cK/4TS9RPxtUV6ARdIh4xyfg9kk1l72ilm
FCCFpmYfuWOlWH1yRCw63rz7hYzMQO71YQcXGu1CGSqr1gtOJ3nW32ATeDU1wJYx
7jH5xxfHI80+Z0pXuIQw9K/hsLK8wHMFTk0Thp4e1/nCrPHIlGsD48odjWW1SgyD
FH94clh6YaUAewnS1SohgQSKr3vCcnPigF1pWcw1d8i3JwfJ+0fkQ6/TYK9HiTmU
jnGF2bMKQ7A1ggmjQVDOuOpTobj4dG/QOZkyUaxzsrCUHJW3Qjz3pWoITKgl4BBL
B+53VQahAoGBAP9Mc3YDvCeqNcjWKVzboi/HbjKxVrhjl5F1VwWeW6X5CnTheQ/g
Zu99ATjVHIzETiln+C4CxwQCCQ3ZmQQnrj5U+fqqFtfLqTVjBa0OwN65yJrVaQEM
Ef/9ax//iA/m2pzzW4rt0veolYSz8Ge7s6jsALG9XaZdUMwkiI2mI6v7AoGBAPFK
mDWxzoEJ0u8VJRXxmdYaubu6ucAMPh45m2fZgmqsCVEXNL5pvDu1YuSLr08sKEjx
BlSTPPQVTt5qT3nu0ngtHSbU9M0tWtJzim3Fz3OyNVG25mU+9O1hKCfPovk2OaX8
neKyF/BBxP8BNA6K6woypqZp5tnXd1DUKWYqg1DZAoGBALQIrcOjjqRKG/OtUy3w
lMcs1EFbXdRaJyCkpuGHcwnwPbd+6WiQzwZEGQCDCMccCCKa9yE7RC1HYisqMAYG
FZJPSpnCKKm1LXZAhlgr90cZrKXDqXDbmjXz9/9wq/rKyY+07fFjFUsgz4/tdLMy
YtfU1giBifEwDTJo8QMzDiTRAoGAGJY3SFFj73YmzkHjU4cY295BSsXOI6mbssy/
7ycUyPXaxS6OK1Du406qUwuAw5qGSFh3Aqs2LND3BmbizlPtkl1WeRx+DWIvvP4U
/vaHGwzvrfHrLCnsHzwlMVlRC//gg+9nzy/CjLLG9g0TVuAE7zcWECL+aPgxqkTU
Kxrt4pECgYAUy2aPl6Av36G/8BVir8w+5Wxhs1qUSBVPUjb+RskXIAiIg9t2jFD5
6iPDypJmtE9vbh4T0HdQ9IuJuywt08ebntNTt8ZKhcK17qMHcRPiaKk9chmHTCVu
ys5Op0eHNdv/Cvnmv//u2Q93os9pULh0/TMDDAcsWwKFNw+pYLxC/A==
-----END RSA PRIVATE KEY-----`);

var theirRsa = new JSEncrypt();
theirRsa.setPublicKey(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8KFclmpU+2oFHKfgoYM4
Drw87qZIacNfaz/BieZ0aVSYlBymVodBrJeYzao+UpxuKrzMWBBZg3QhRCnbaNAK
mmNfSheG02guY8ojOjoe/P/RTX0qa8E57O0d52asqQY4A2d4cCEZzEmDnZIC1NSP
aXdgWzgphgzgrs2dLqj4UhM+BnpKWKKRUyJMsTY0aV36Xscy1htqQw26aDeKUrik
OQeQKbIba952ZIZ7LEb1cYnplIfWgIio5kDfj1HESIASkmKTSWAUTf7C79jtbu3v
LAZI4fA8QdW7kQb1XNv3WXM73LItDimMnJZgTAP+PW7ZLT5DHWRyYGNX/5t3KWw3
wwIDAQAB
-----END PUBLIC KEY-----`);

var lastSentMessage = null;

function encryptMessage(msg) {
	console.log("Encrypting message: " + msg);
	var encrypted = theirRsa.encrypt(msg);
	console.log("Encrypted: " + encrypted);
	return encrypted;
}

function decryptMessage(msg) {
	console.log("Decrypting message: " + msg);
	var decrypted = myRsa.decrypt(msg);
	console.log("Decrypted: " + decrypted);

	if (decrypted === null) {
		return msg;
	}
	else {
		return decrypted;
	}
}

function attachToInputBox() {
	var inputBox = document.querySelector("#post_textbox");

	inputBox.addEventListener("keydown", function(event) {
		if (event.keycode === 13 || event.which === 13) {
			lastSentMessage = event.target.value;
			var newMsg = encryptMessage(event.target.value);
			event.target.value = newMsg;
			event.target.dispatchEvent(new Event("input", {bubbles: true, target: event.target, data:newMsg}));
		}
	});
}

function attachToChannelHeader() {
	var channelDropdown = document.querySelector("#channel-header ul.dropdown-menu");

	var addKeyLI = document.createElement("LI");
	var addKeyLink = document.createElement("A");
	var addKeyText = document.createTextNode("Set public key");
	addKeyLink.appendChild(addKeyText);
	addKeyLI.appendChild(addKeyLink);

	channelDropdown.appendChild(addKeyLI);
}

function isEncryptedNode(node) {
	var pNode = node.querySelector(".post-message__text p");
	if (pNode.childNodes.length != 1 || pNode.childNodes[0].nodeName !== "#text")
		return false;

	try {
		atob(pNode.childNodes[0].nodeValue);
		return true;
	}
	catch(ex) {
		return false;
	}
}

function decryptMessageNode(node) {
	node.classList.add("decrypted");

	if (isEncryptedNode(node)) {
		var textNode = node.querySelector(".post-message__text p").childNodes[0];
		if (node.id.indexOf(":") >= 0) {
			// Ignore temporary elements added by React
			textNode.nodeValue = lastSentMessage;
			return;
		}

		node.classList.add("secure-message");
		if (node.classList.contains("current--user")) {
			if (lastSentMessage === null)
				textNode.nodeValue = "(unknown)";
			else
				textNode.nodeValue = lastSentMessage;

			lastSentMessage = null;
		} else {
			textNode.nodeValue = decryptMessage(textNode.nodeValue);
		}
	}
}

(function() {
	'use strict';
	var attachments = {
		"#post_textbox": attachToInputBox,
		"#channel-header ul.dropdown-menu": attachToChannelHeader
	};
	var attachmentObserver = new MutationObserver(function(mutations) {
		for (var query in attachments) {
			if (document.querySelector(query) !== null) {
				attachments[query]();
				delete attachments[query];
			}
		}

		if (attachments.length === 0) {
			attachmentObserver.disconnect();
		}
	});
	attachmentObserver.observe(document.documentElement, {childList: true, subtree: true});

	var msgReceivedObserver = new MutationObserver(function(mutations) {
		var newMessages = document.querySelectorAll("div.post:not(.decrypted)");
		if (newMessages.length !== 0) {
			newMessages.forEach(decryptMessageNode);
		}
	});
	msgReceivedObserver.observe(document.documentElement, {childList: true, subtree: true});
})();
