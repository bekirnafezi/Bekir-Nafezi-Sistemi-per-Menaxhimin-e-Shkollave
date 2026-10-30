from rest_framework import serializers
from .models import Klasa, Nxenesi, Mesimdhenesi, Lenda , Angazhimi, Nota


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


        # ==========================================
# Serializer per angazhimet e mesimdhenesve
# ==========================================

class AngazhimiSerializer(serializers.ModelSerializer):

    class Meta:
        model = Angazhimi
        fields = ['id', 'mesimdhenesi', 'klasa', 'lenda']
        read_only_fields = ['id']

    def validate(self, attrs):

        mesimdhenesi = attrs.get(
            'mesimdhenesi',
            getattr(self.instance, 'mesimdhenesi', None)
        )

        klasa = attrs.get(
            'klasa',
            getattr(self.instance, 'klasa', None)
        )

        lenda = attrs.get(
            'lenda',
            getattr(self.instance, 'lenda', None)
        )

        # Kontrollojme nese angazhimi ekziston
        ekziston = Angazhimi.objects.filter(
            mesimdhenesi=mesimdhenesi,
            klasa=klasa,
            lenda=lenda
        )

        # Gjate ndryshimit nuk llogarisim regjistrimin aktual
        if self.instance:
            ekziston = ekziston.exclude(id=self.instance.id)

        if ekziston.exists():
            raise serializers.ValidationError(
                "Ky angazhim ekziston tashme."
            )

        return attrs

    # ==========================================
# Serializer per notat e nxenesve
# ==========================================

class NotaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Nota
        fields = ['id', 'nxenesi', 'angazhimi', 'vleresimi']
        read_only_fields = ['id']

    # Kontrollojme vleren e notes
    def validate_vleresimi(self, value):

        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Nota duhet te jete nga 1 deri ne 5."
            )

        return value

    # Kontrollojme lidhjen nxenes - angazhim
    def validate(self, attrs):

        nxenesi = attrs.get(
            'nxenesi',
            getattr(self.instance, 'nxenesi', None)
        )

        angazhimi = attrs.get(
            'angazhimi',
            getattr(self.instance, 'angazhimi', None)
        )

        if nxenesi and angazhimi:

            if nxenesi.klasa_id != angazhimi.klasa_id:

                raise serializers.ValidationError(
                    "Nxenesi nuk i perket klases se ketij angazhimi."
                )

        return attrs