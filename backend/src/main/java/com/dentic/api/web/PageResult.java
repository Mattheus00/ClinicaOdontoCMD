package com.dentic.api.web;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.function.Function;

public record PageResult<T>(List<T> content, int totalPages, long totalElements, int number, int size) {
    public static PageRequest request(Integer page, Integer size, Sort sort) {
        return PageRequest.of(Math.max(0, page == null ? 0 : page), Math.max(1, Math.min(50, size == null ? 20 : size)), sort);
    }
    public static <S,T> PageResult<T> from(Page<S> page, Function<S,T> mapper) {
        return new PageResult<>(page.getContent().stream().map(mapper).toList(), page.getTotalPages(), page.getTotalElements(), page.getNumber(), page.getSize());
    }
}
