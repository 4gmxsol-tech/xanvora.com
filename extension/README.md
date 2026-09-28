# Xanvora Live Bridge

Chrome/Chromium Manifest V3 bridge for showing a live view of a reverse-image-search results tab inside Xanvora.

## Flow

1. Open Xanvora and analyze an image.
2. Copy the image and open Yandex Images.
3. Paste/upload the image in Yandex.
4. Keep the Yandex results tab active.
5. Click the Xanvora Live View extension action.
6. The visible Yandex results are captured and sent to the open Xanvora tab.

No reverse-image API and no Xanvora image upload server are used.

## Install

1. Open `chrome://extensions/`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this `extension/` directory.
5. Keep Xanvora open in another tab.
6. Run the Yandex visual search.
7. Click Xanvora Live View while the Yandex results tab is active.

The current bridge intentionally uses a user-invoked visible screenshot instead of an automated third-party DOM collector.
