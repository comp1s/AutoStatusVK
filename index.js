const { VK } = require('vk-io');
require('dotenv').config();

const vk = new VK({
    token: process.env.VK_ACCESS_TOKEN,
    apiVersion: '5.131'
});

async function getAvatarLikes() {
    try {
        const response = await vk.api.photos.get({
            owner_id: process.env.VK_USER_ID,
            album_id: 'profile',
            rev: 1,
            count: 1,
            extended: 1,
        });

        if (response.items && response.items.length > 0 && response.items[0].likes) {
            return response.items[0].likes.count;
        } else {
            console.error('No avatar or likes data found');
            return 0;
        }
    } catch (error) {
        console.error('Error when getting the number of likes:', error);
        return 0;
    }
}

async function getTotalMessageCount() {
    try {
        const response = await vk.api.messages.getConversations({ count: 200, extended: 1 });

        const totalMessageCount = response.count || 0;

        return totalMessageCount;
    } catch (error) {
        console.error('Error when retrieving the total number of messages:', error);
        return 0;
    }
}

async function getLastMessageInfo() {
    try {
        const response = await vk.api.messages.getConversations({ count: 1, extended: 1 });

        if (response.items && response.items.length > 0) {
            const lastMessage = response.items[0].last_message;

            if (lastMessage.from_id > 0) {
                const senderId = lastMessage.from_id;
                const senderProfile = response.profiles?.find(profile => profile.id === senderId);

                if (senderProfile) {
                    return `${senderProfile.first_name} ${senderProfile.last_name}`;
                } else {
                    return 'unknown sender';
                }
            } else {
                const groupId = Math.abs(lastMessage.from_id);
                const groupInfo = response.groups?.find(group => group.id === groupId);

                if (groupInfo) {
                    return `${groupInfo.name}`;
                } else {
                    return 'Message from the group';
                }
            }
        } else {
            return 'no data';
        }
    } catch (error) {
        console.error('Error when retrieving information about the last message:', error);
        return 'no data';
    }
}

async function getBlockedCount() {
    try {
        const blockedUsers = await vk.api.friends.get({ filter: 'blacklisted' });

        return blockedUsers.count || 0;
    } catch (error) {
        console.error('Error in obtaining the number of people in an emergency:', error);
        return 0;
    }
}

async function getOnlineStatus() {
    try {
        const [userInfo] = await vk.api.users.get({ fields: 'online' });

        return userInfo.online ? '📱' : '😴';
    } catch (error) {
        console.error('Error in obtaining online status:', error);
        return '😴';
    }
}


async function updateStatus() {
    try {
        const likesCount = await getAvatarLikes();
        const messageCount = await getTotalMessageCount();
        const lastSender = await getLastMessageInfo();
        const blockedCount = await getBlockedCount();
        const onlineStatus = await getOnlineStatus();

        const now = new Date();
        const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        const statusText = `Онлайн: ${onlineStatus} | 🕒Время: ${time} | 📆Дата: ${date} | На аве: ${likesCount} ❤️ | ✉️Сообщений: ${messageCount} | 💬Последний от ${lastSender} | ⛔️В чс: ${blockedCount}`;

        await vk.api.account.saveProfileInfo({ status: statusText });
        console.log(`Status updated: ${statusText}`);
    } catch (error) {
        console.error('Error on status update:', error);
    }
}

//Auto status update every 1 minute
setInterval(updateStatus, 60 * 1000);

updateStatus();
