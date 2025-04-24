const { DOMParser } = require("@xmldom/xmldom");

const checkMessageAction = (xmlBody) => {
  const xmlparser = new DOMParser();
  const xmlparsed = xmlparser.parseFromString(xmlBody, "text/xml");
  const namesplaceURI = "http://www.w3.org/2005/08/addressing";
  const messageActionElement = xmlparsed.getElementsByTagNameNS(
    namesplaceURI,
    "Action"
  )[0];
  const messageAction = messageActionElement
    ? messageActionElement.textContent.trim()
    : null;
  return messageAction;
};

module.exports = checkMessageAction;
