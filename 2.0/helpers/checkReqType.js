const checkReqType = (xmlBody) => {
  // Checking Flag in XML and Return Response Type for File Name
  //! IDeaS
  const flag_ideas_1 = xmlBody.includes(
    "HTNG_ARIAndReservationPushService#OTA_HotelRatePlanNotifRQ"
  );
  if (flag_ideas_1) {
    return "RateRQ";
  }
  const flag_ideas_2 = xmlBody.includes(
    "HTNG_ARIAndReservationPush#OTA_HotelResNotifRQ"
  );
  if (flag_ideas_2) {
    return "NotifRQ";
  }
  const flag_ideas_3 = xmlBody.includes("OTA_HotelRatePlanNotifRQ");
  if (flag_ideas_3) {
    return "RateRQ";
  }
  //TODO Add other...

  //! Default
  return "Request_Body";
};

module.exports = checkReqType;
