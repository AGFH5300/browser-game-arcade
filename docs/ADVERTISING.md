# Advertising configuration

No monetized ads are active. AD_PLACEHOLDERS and AD_LEFT_ENABLED/AD_RIGHT_ENABLED/AD_BOTTOM_ENABLED control labelled development spaces. No database migration is needed.

For production set ADSENSE_CLIENT to the approved ca-pub identifier, ADSENSE_ENABLED=true and ADSENSE_CMP_READY=true only after completing consent configuration. Without all three, no Google script loads. Games do not depend on the script. Configure Auto ads in the AdSense console: Overlay formats → Advanced settings → side rail positions Left and right, anchor position Bottom only. Do not add manual sticky rails. No live ad units or account consent setup have been claimed.

Google sources:
https://support.google.com/adsense/answer/16242705
https://support.google.com/adsense/answer/15484692
https://support.google.com/adsense/answer/13554116

Use a Google-certified TCF CMP for the applicable EEA/UK/Swiss advertising traffic. The configuration gate is not itself a consent manager; the publisher must configure a certified solution, for example Google Privacy & messaging, before enabling ads. Side rail and bottom anchor placements are controlled by Google eligibility and publisher settings, not forced by page CSS.
