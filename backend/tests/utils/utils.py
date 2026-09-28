from faker import Faker

fake = Faker()


def random_lower_string() -> str:
    return fake.password(length=32)


def random_email() -> str:
    return fake.unique.email()


def random_username() -> str:
    return f"user_{fake.unique.random_int(min=100000, max=999999999)}"
