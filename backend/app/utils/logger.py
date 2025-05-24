import logging
from cmreslogging.handlers import CMRESHandler

def setup_logger(name='app', level=logging.INFO):
    try:
        logger = logging.getLogger(name)
        if logger.handlers:
            return logger

        # Console log handler
        console_handler = logging.StreamHandler()
        formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # Elasticsearch log handler
        es_handler = CMRESHandler(
            hosts=[{'host': 'elasticsearch', 'port': 9200}],
            auth_type=CMRESHandler.AuthType.NO_AUTH,
            es_index_name="flask-logs",
            use_ssl=False,
            raise_on_indexing_exceptions=True
        )
        logger.addHandler(es_handler)

        logger.setLevel(level)
        return logger
    except ex:
        logger.info(f"Failed to set up logger: {ex}")
