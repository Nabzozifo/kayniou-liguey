const User = require('../models/User');

// Plans de souscription
const PLANS = {
    basic: {
        id: 'basic',
        name: 'Basique',
        price: 0,
        features: [
            'Accès aux offres (retard 24h)',
            'Bas de liste dans les recherches',
            'Max 5 candidatures par jour'
        ],
        applicationLimit: 5
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 10000,
        features: [
            'Accès instantané aux offres',
            'Badge Premium',
            'Priorité dans les recherches',
            'Candidatures illimitées',
            'Notifications prioritaires'
        ],
        applicationLimit: Infinity
    }
};

// @desc    Obtenir les plans disponibles
// @route   GET /api/subscription/plans
// @access  Public
exports.getPlans = (req, res) => {
    res.json({
        success: true,
        plans: Object.values(PLANS)
    });
};

// @desc    S'abonner à un plan (Mock paiement)
// @route   POST /api/subscription/subscribe
// @access  Private
exports.subscribe = async (req, res) => {
    try {
        const { planId } = req.body;

        if (!['basic', 'premium'].includes(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Plan invalide'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour l'abonnement
        // Note: Dans un cas réel, on vérifierait le paiement ici

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 jours

        // For premium plan: set as pending until admin approves
        // For basic plan: activate immediately
        const status = planId === 'premium' ? 'pending' : 'active';

        user.subscription = {
            plan: planId,
            startDate: planId === 'premium' ? null : startDate,
            endDate: planId === 'premium' ? null : endDate,
            autoRenew: planId !== 'premium',
            status,
        };

        await user.save();

        const message = planId === 'premium'
            ? 'Demande Premium envoyée ! Un administrateur validera votre abonnement sous 24–48h.'
            : `Abonnement ${PLANS[planId].name} activé avec succès`;

        res.json({
            success: true,
            message,
            subscription: user.subscription
        });

    } catch (error) {
        console.error('❌ Erreur souscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la souscription',
            error: error.message
        });
    }
};

// @desc    Annuler l'abonnement
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // On passe simplement en status cancelled, mais on garde la date de fin
        user.subscription.status = 'cancelled';
        user.subscription.autoRenew = false;

        await user.save();

        res.json({
            success: true,
            message: 'Abonnement annulé',
            subscription: user.subscription
        });

    } catch (error) {
        console.error('❌ Erreur annulation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation',
            error: error.message
        });
    }
};

// @desc    Obtenir le statut de l'abonnement actuel
// @route   GET /api/subscription/status
// @access  Private
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier si expiré
        if (user.subscription.endDate && new Date() > user.subscription.endDate) {
            if (user.subscription.status === 'active') {
                user.subscription.status = 'expired';
                user.subscription.plan = 'basic'; // Restart basic if expired
                await user.save();
            }
        }

        res.json({
            success: true,
            subscription: user.subscription,
            planDetails: PLANS[user.subscription.plan]
        });

    } catch (error) {
        console.error('❌ Erreur statut abonnement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du statut',
            error: error.message
        });
    }
};
