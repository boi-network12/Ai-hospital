// components/PromotedCard.tsx
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { PromotedItem } from '@/types/promoted';

interface PromotedCardProps {
    item: PromotedItem;
    onPress: () => void;
}

export default function PromotedCard({ item, onPress }: PromotedCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <ImageBackground
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/300x150' }}
                style={styles.background}
                imageStyle={{ borderRadius: hp(1) }}
            >
                <View style={styles.overlay}>
                    {item.sponsored && <Text style={styles.sponsored}>Sponsored</Text>}

                    <Text style={styles.title}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}

                    <View style={styles.cta}>
                        <Text style={styles.ctaText}>{item.callToAction || 'Learn More →'}</Text>
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: wp(42),
        height: hp(22),
        marginBottom: hp(2),
        alignSelf: 'center',
    },
    background: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: hp(1.5),
        borderRadius: hp(1),
    },
    sponsored: {
        color: '#FFD700',
        fontSize: hp(1.2),
        fontWeight: 'bold',
        marginBottom: hp(0.5),
    },
    title: {
        color: '#fff',
        fontSize: hp(1.8),
        fontWeight: '700',
    },
    subtitle: {
        color: '#ddd',
        fontSize: hp(1.4),
        marginTop: hp(0.5),
    },
    cta: {
        marginTop: hp(1),
    },
    ctaText: {
        color: '#4ADE80',
        fontWeight: '600',
        fontSize: hp(1.6),
    },
});