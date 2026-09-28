import factory

from app.modules.users.schemas import UserCreate


class UserCreateFactory(factory.Factory):
    class Meta:
        model = UserCreate

    email = factory.Sequence(lambda n: f"user-{n}@example.com")
    username = factory.Sequence(lambda n: f"user_{n}")
    password = factory.Faker("password", length=32)
    full_name = factory.Faker("name")
