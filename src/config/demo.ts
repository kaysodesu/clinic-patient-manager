// Settings for the PUBLIC demo build only (npm run build:demo). The full app ignores this file.
export const DEMO = {
  /** Free preview length for each visitor's browser. */
  trialMinutes: 20,
  /** Where "Get the full version" goes. */
  storeUrl: 'https://kcasontechsolutions.gumroad.com/',
  /** Where "Request more time" and "Join for perks" go. Make sure the invite never expires. */
  communityUrl: 'https://discord.gg/jNRRuj6gg',
  /** How long a valid access code unlocks the demo for. */
  accessCodeDays: 7,
  /**
   * SHA-256 hashes of the access codes you hand out (the codes themselves are never stored here).
   * Make a new one with:  node -e "console.log(require('crypto').createHash('sha256').update('YOUR-CODE'.toUpperCase()).digest('hex'))"
   */
  accessCodeHashes: [
    'c1a85313f98108840fd20bcba464e721bed1ace4c6b476575998b2a57e117a7f',
    'bbc1d253be132c4bc7c5335978fb20475de50e41d3624e1c5a651c948d0f3af3',
    '253d4d6b0e98410f011f263162e51c604dc5e1b52e7f522fa4f6371893b56d5e',
    '8a93d082875d2e0cc38c6b5a4d4f8a3eb8b2f2cd2528675d8184b3a8262aa214',
    '35401d7fa1016eaf6caafabc3aee2eea8d3fe1ddfdcb57ceb8e4fa69c820d362',
    '7ebd24ba852a8ccd8a0daab60aa4246c50970544859f5ac569c93062a112e88e',
    '519e2ad676c00702938143288deae5454984f5a87bdd9ad7fe2abff7ee187a17',
    'e927d581ae0d9c64a15e5957715eecf34e989a34470cd4698f901082f3f5230c',
    '85b49cc19fd9f9cb5d7c0804cff639d3d7ad41b17cf8c37f2dea3fb846203b30',
    'dfe8deaae21ade537c19edf5f3a9aa3fbbaf125dfe6b1965a7e3dcaa5f641488',
    'efa65b750fa8abc663514f48431d8f0ae0c6ed642db2393aa0ec1a30611e25c5',
    '33fc4454c550c322ac45c98fb92b1192236a734ef13d8cd7ebe524eee62a84f8',
  ] as string[],
};
