# ============================================
# UPDATE PARCIAL SEGURO (MIXIN)
# ============================================
# Classe base para todos os schemas de UPDATE.
# Garante que:
#   1. Strings vazias ("") sejam tratadas como "não informado" (None),
#      evitando que campos em branco apaguem dados existentes.
#   2. O payload não possa ser totalmente vazio: se nenhum campo for enviado
#      (ou todos forem vazios/nulos), retorna erro "Envie ao menos um campo".

from pydantic import BaseModel, field_validator, model_validator


class PartialUpdate(BaseModel):
    """Mixin de update parcial. Os schemas de UPDATE herdam dela."""

    # Roda ANTES da validação de cada campo: converte "" em None.
    @field_validator("*", mode="before")
    @classmethod
    def vazio_para_none(cls, value):
        """Converte strings vazias em None para que não sobrescrevam o valor atual."""
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    # Roda DEPOIS da validação: bloqueia payload sem nenhuma alteração real.
    @model_validator(mode="after")
    def ao_menos_um_campo(self):
        """Rejeita edições onde nenhum campo foi preenchido."""
        if all(value is None for value in self.model_dump().values()):
            raise ValueError("Envie ao menos um campo para editar")
        return self