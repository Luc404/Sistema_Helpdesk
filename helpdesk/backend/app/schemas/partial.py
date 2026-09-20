from pydantic import BaseModel, field_validator, model_validator

class PartialUpdate(BaseModel):
    @field_validator("*", mode="before")
    @classmethod
    def vazio_para_none(cls, value):
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    @model_validator(mode="after")
    def ao_menos_um_campo(self):
        if all(value is None for value in self.model_dump().values()):
            raise ValueError("Envie ao menos um campo para editar")
        return self