from rest_framework import serializers
from .models import Klasa, Nxenesi, Mesimdhenesi, Lenda


class KlasaSerializer(serializers.ModelSerializer):

 class Meta:
        model = Klasa
        fields = ['id', 'emri', 'kujdestari']
        read_only_fields = ['id']

class NxenesiSerializer(serializers.ModelSerializer):

    emri = serializers.CharField(
        source='perdorues.first_name',
        read_only=True
    )

    mbiemri = serializers.CharField(
        source='perdorues.last_name',
        read_only=True
    )

    email = serializers.EmailField(
        source='perdorues.email',
        read_only=True
    )

    class Meta:
        model = Nxenesi
        fields = [
            'id',
            'perdorues',
            'emri',
            'mbiemri',
            'email',
            'klasa'
        ]
        read_only_fields = ['id']

    def validate_perdorues(self, perdorues):

        if perdorues.roli != 'nxenes':
            raise serializers.ValidationError(
                'Perdoruesi duhet te kete rolin nxenes.'
            )

        return perdorues

    # ==========================================
# Serializer per mesimdhenesit
# ==========================================

class MesimdhenesiSerializer(serializers.ModelSerializer):

    emri = serializers.CharField(
        source='perdorues.first_name',
        read_only=True
    )

    mbiemri = serializers.CharField(
        source='perdorues.last_name',
        read_only=True
    )

    email = serializers.EmailField(
        source='perdorues.email',
        read_only=True
    )

    class Meta:
        model = Mesimdhenesi

        fields = [
            'id',
            'perdorues',
            'emri',
            'mbiemri',
            'email'
        ]

        read_only_fields = ['id']

    def validate_perdorues(self, perdorues):

        if perdorues.roli != 'mesimdhenes':
            raise serializers.ValidationError(
                'Perdoruesi duhet te kete rolin mesimdhenes.'
            )

        return perdorues

    # ==========================================
# Serializer per lendet
# ==========================================

class LendaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Lenda

        fields = [
            'id',
            'emri'
        ]

        read_only_fields = ['id']