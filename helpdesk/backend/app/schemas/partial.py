# ============================================
# UPDATE PARCIAL SEGURO (MIXIN)
# ============================================
# Classe base para todos os schemas de UPDATE.
# Garante que:
#   1. Strings vazias ("") sejam tratadas como "não informado" (None),
#      evitando que campos em branco apaguem dados existentes.
#   2. O payload não possa ser totalmente vazio: se nenhum campo for enviado
#      (ou todos forem vazios/nulos), retorna erro "Envie ao menos um campo".

from typing import ClassVar

from pydantic import BaseModel, field_validator, model_validator


class PartialUpdate(BaseModel):
    """Mixin de update parcial. Os schemas de UPDATE herdam dela."""

    # Nomes dos campos que o cliente pode LIMPAR explicitamente, ou seja,
    # mandar como null de propósito. Entra aqui apenas quem tem um schema
    # sobrescrevendo "ao_menos_um_campo" (ver ServicoUpdate).
    campos_limpaveis: ClassVar[frozenset] = frozenset()

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
        """Rejeita edições onde nenhum campo foi preenchido.

        Exceção: os campos listados em "campos_limpaveis" podem ser
        enviados como null de propósito para apagar o valor. Sem isso,
        mandar null seria indistinguível de "não informei nada" e não
        haveria como limpar um campo que aceita nulo.

        Note que o campo limpável não precisa ter valor: o que vale é ele
        ter sido ENVIADO, o que se descobre em "model_fields_set".
        """
        valores = self.model_dump()

        # Caso 1: algum campo comum recebeu valor de verdade.
        if any(
            valor is not None
            for campo, valor in valores.items()
            if campo not in self.campos_limpaveis
        ):
            return self

        # Caso 2: nada comum foi preenchido, mas o cliente mandou um
        # campo limpável explicitamente (ex.: {"icone": null} = apagar).
        if self.campos_limpaveis & self.model_fields_set:
            return self

        # Caso 3: payload realmente vazio, ex.: {} ou {"nome": ""}.
        raise ValueError("Envie ao menos um campo para editar")