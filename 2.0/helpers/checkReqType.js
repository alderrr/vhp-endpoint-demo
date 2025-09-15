const checkReqType = (xmlBody) => {
  // Checking Flag in XML and Return Response Type for File Name
  //! IDeaS
  if (xmlBody.includes("HTNG_ARIAndReservationPush#OTA_HotelResNotifRQ"))
    return "RateRQ";
  if (xmlBody.includes("HTNG_ARIAndReservationPush#OTA_HotelResNotifRQ"))
    return "NotifRQ";
  if (xmlBody.includes("OTA_HotelRatePlanNotifRQ")) return "RateRQ";
  if (xmlBody.includes("OTA_HotelResNotifRQ")) return "NotifRQ";
  //TODO Add other...

  //! Default
  return "Request_Body";
};

module.exports = checkReqType;
