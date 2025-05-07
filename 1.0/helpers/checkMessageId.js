const { DOMParser } = require("@xmldom/xmldom");

const checkMessageId = (xmlBody) => {
  const xmlparser = new DOMParser();
  const xmlparsed = xmlparser.parseFromString(xmlBody, "text/xml");
  const namesplaceURI = "http://www.w3.org/2005/08/addressing";
  const messageIdElement = xmlparsed.getElementsByTagNameNS(
    namesplaceURI,
    "MessageID"
  )[0];
  const messageId = messageIdElement
    ? messageIdElement.textContent.trim()
    : null;
  return messageId;
};

module.exports = checkMessageId;
