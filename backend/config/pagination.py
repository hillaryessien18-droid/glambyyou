from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """Page-number pagination that also reports page size and page count."""

    page_size_query_param = "limit"
    max_page_size = 60

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "page": self.page.number,
                "limit": self.get_page_size(self.request),
                "totalPages": self.page.paginator.num_pages,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )

    def get_paginated_response_schema(self, schema):
        response = super().get_paginated_response_schema(schema)
        response["properties"].update(
            {
                "page": {"type": "integer"},
                "limit": {"type": "integer"},
                "totalPages": {"type": "integer"},
            }
        )
        return response
