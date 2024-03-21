# biliarchiverbot

## Deploy to Vercel

1. fork this repository
2. open vercel.com and create a new project
3. connect the project to your forked repository
4. set the environment variables.

   If you don't have a bot yet, you can create one by talking to [@BotFather](https://t.me/BotFather) on Telegram.

   If you don't know the deployed URL, you can deploy the project first and then set the environment variables later.

   ``` env
    BILIARCHIVER_WEBAPP=<THE_DEPLOYED_WEBAPP_URL>
    BILIARCHIVER_USERNAME=<THE_TELEGRAM_USERNAME_OF_BILIARCHIVER_BOT>
    BILIARCHIVER_API=<THE_API_URL_OF_BILIARCHIVER>
    BILIARCHIVER_BOT=<YOUR_BOT_TOKEN>
   ```

5. deploy
6. set the bot's webhook to the deployed URL. You can copy the link below and replace your bot's token and the deployed URL.

   ``` shell
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<DEPLOY_URL>/bot/webhook
   ```

## Local Development

1. clone this repository
2. install the dependencies

   ``` shell
   pnpm install
   ```
3. create a `.env` file and set the environment variables.

   ``` env
    BILIARCHIVER_WEBAPP=<THE_DEPLOYED_WEBAPP_URL>
    BILIARCHIVER_USERNAME=<THE_TELEGRAM_USERNAME_OF_BILIARCHIVER_BOT>
    BILIARCHIVER_API=<THE_API_URL_OF_BILIARCHIVER>
    BILIARCHIVER_BOT=<YOUR_BOT_TOKEN>
   ```
4. start the development server

   ``` shell
    pnpm dev
    ```
5. set the bot's webhook to the deployed URL. 

   You may use [ngrok](https://ngrok.com/) to expose your local server to the internet, or open the port 5173 on your router or the VPS. Then you can copy the link below and replace your bot's token and the deployed URL.

   ``` shell
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<DEPLOY_URL>/bot/webhook
   ```
