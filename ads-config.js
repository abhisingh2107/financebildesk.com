/*
  FinanceBilldesk ad settings. Edit only this file.

  GOOGLE ADSENSE
  1. Create an AdSense account and add your site.
  2. Put your publisher ID in "client" (looks like ca-pub-1234567890123456).
  3. In AdSense, create 3 display ad units (responsive) and paste each unit's
     slot number below: banner, mid, bottom.
  4. Set enabled to true and showPlaceholders to false. Also put your ID in ads.txt.

  OTHER AD NETWORKS / SPONSOR BANNERS
  Paste the network's ad code as a string in "custom" for any slot.
  A custom code always wins over AdSense for that slot.

  Slots:
    banner = right under the menu bar, above the page heading (every page)
    mid    = after the tool (after the options on the home page)
    bottom = after the FAQ
*/
window.TK_ADS = {
  enabled: false,
  showPlaceholders: false,   // shows dashed "Advertisement" boxes so you can see the layout. Keep false on the live site.
  client: 'ca-pub-6484114404141398',
  slots: {
    banner: '0000000001',
    mid:    '0000000002',
    bottom: '0000000003'
  },
  custom: {
    banner: '',
    mid: '',
    bottom: ''
  }
};
