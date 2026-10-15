package com.substring.irctc.repositories;

import com.substring.irctc.entity.BookingPassenger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingPassengerRepository extends JpaRepository<BookingPassenger,Long> {
    List<BookingPassenger> findByTrainSeat_Id(Long trainSeatId);
}
