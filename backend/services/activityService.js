const User = require('../models/User');
const ActivityReward = require('../models/ActivityReward');
const Transaction = require('../models/Transaction');

class ActivityService {
    static async processLoginReward(userId) {
        const user = await User.findById(userId);
        await user.updateLoginStreak();
        
        // Check for streak rewards
        const streakRewards = await ActivityReward.find({
            type: 'login_streak',
            'conditions.streakDays': user.activityMetrics.loginStreak.currentStreak
        });
        
        for (const reward of streakRewards) {
            await this.grantReward(user, reward);
        }
    }
    
    static async processExchangeActivity(userId, exchangeAmount, fromCurrency, toCurrency) {
        const user = await User.findById(userId);
        
        // Update exchange metrics
        user.activityMetrics.exchangeMetrics.totalVolume += exchangeAmount;
        user.activityMetrics.exchangeMetrics.monthlyVolume += exchangeAmount;
        user.activityMetrics.exchangeMetrics.totalTrades += 1;
        user.activityMetrics.exchangeMetrics.lastTradeDate = new Date();
        
        // Check for volume-based rewards
        const volumeRewards = await ActivityReward.find({
            type: 'exchange_volume',
            'conditions.minAmount': { $lte: user.activityMetrics.exchangeMetrics.monthlyVolume }
        });
        
        for (const reward of volumeRewards) {
            await this.grantReward(user, reward);
        }
        
        await user.save();
    }
    
    static async processCommunityActivity(userId, activityType, points) {
        const user = await User.findById(userId);
        
        // Update community points
        user.activityMetrics.communityPoints += points;
        
        // Check for community engagement rewards
        const communityRewards = await ActivityReward.find({
            type: 'community_engagement',
            'conditions.activityCount': { $lte: user.activityMetrics.communityPoints }
        });
        
        for (const reward of communityRewards) {
            await this.grantReward(user, reward);
        }
        
        await user.save();
    }
    
    static async grantReward(user, reward) {
        // Create reward transaction
        const transaction = new Transaction({
            user: user._id,
            type: 'reward',
            amount: reward.amount,
            currency: reward.currency,
            description: `Reward for ${reward.type}`,
            status: 'completed',
            metadata: {
                rewardType: reward.type,
                conditions: reward.conditions
            }
        });
        
        // Update user balance
        await user.updateBalance(reward.currency, reward.amount);
        
        // Record earned reward
        user.earnedRewards.push({
            type: reward.type,
            amount: reward.amount,
            currency: reward.currency,
            description: `Reward for ${reward.type}`
        });
        
        await transaction.save();
        await user.save();
    }
}

module.exports = ActivityService; 